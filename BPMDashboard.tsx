// @ts-nocheck
"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import LiveBPMDisplay from './LiveBPMDisplay';
import BPMChart from './BPMChart';
import DeviceStatusPanel from './DeviceStatusPanel';
import AlertsPanel from './AlertsPanel';
import SystemStatusIndicator from './SystemStatusIndicator';
import StatisticsPanel from './StatisticsPanel';
import ReportGenerator from './ReportGenerator';
import { Button } from './ui/button';
import { RefreshCw, Settings, Bell, Activity, HeartPulse } from 'lucide-react';

interface BPMReading {
  id: string;
  bpm: number;
  source: string;
  quality: string;
  timestamp: string;
  processedBpm?: number;
  confidence?: number;
  isAnomaly?: boolean;
}

interface Device {
  deviceId: string;
  name: string;
  type: string;
  status: string;
  lastHeartbeat: string;
  batteryLevel?: number;
  firmwareVersion?: string;
}

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: string;
  acknowledged: boolean;
  createdAt: string;
  bpmValue?: number;
  resolvedAt?: string;
}

interface SystemStatus {
  activeSource: string;
  failoverCount: number;
  lastArduinoHeartbeat: string;
  lastThingSpeakSync: string;
  systemHealth?: string;
  cacheHealthScore?: number;
}

export default function BPMDashboard() {
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [liveQuality, setLiveQuality] = useState<string>('good');
  const [liveSource, setLiveSource] = useState<string>('arduino');
  const [liveTimestamp, setLiveTimestamp] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [readings, setReadings] = useState<BPMReading[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primaryDeviceId, setPrimaryDeviceId] = useState<string>('ARDUINO_UNO_001');
  
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5 seconds
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Calculate statistics with useMemo for performance
  const calculatedStats = useMemo(() => {
    if (readings.length === 0) return null;
    
    const validReadings = readings.filter((r: BPMReading) => r.bpm > 0);
    if (validReadings.length === 0) return null;
    
    const bpmValues = validReadings.map((r: BPMReading) => r.bpm);
    const avgBpm = bpmValues.reduce((a: number, b: number) => a + b, 0) / bpmValues.length;
    const minBpm = Math.min(...bpmValues);
    const maxBpm = Math.max(...bpmValues);
    
    // Calculate trend (last 5 readings vs previous 5)
    const recentReadings = validReadings.slice(0, Math.min(5, validReadings.length));
    const previousReadings = validReadings.slice(Math.min(5, validReadings.length), Math.min(10, validReadings.length));
    
    const recentAvg = recentReadings.length > 0 
      ? recentReadings.reduce((sum: number, r: BPMReading) => sum + r.bpm, 0) / recentReadings.length 
      : 0;
      
    const previousAvg = previousReadings.length > 0 
      ? previousReadings.reduce((sum: number, r: BPMReading) => sum + r.bpm, 0) / previousReadings.length 
      : 0;
      
    const trend = recentAvg > previousAvg ? 'increasing' : recentAvg < previousAvg ? 'decreasing' : 'stable';
    
    return {
      avgBpm: Math.round(avgBpm),
      minBpm,
      maxBpm,
      totalReadings: validReadings.length,
      last24Hours: validReadings.length,
      trend,
      recentAvg: Math.round(recentAvg),
    };
  }, [readings]);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [readingsRes, devicesRes, alertsRes, statusRes] = await Promise.all([
        fetch('/api/bpm-data?limit=50'),
        fetch('/api/devices'),
        fetch('/api/alerts?limit=20'),
        fetch('/api/system-status'),
      ]);

      if (readingsRes.ok) {
        const data = await readingsRes.json();
        setReadings(data.readings || []);
      } else {
        throw new Error('Failed to fetch BPM readings');
      }

      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data.devices || []);
      } else {
        throw new Error('Failed to fetch devices');
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      } else {
        throw new Error('Failed to fetch alerts');
      }

      if (statusRes.ok) {
        const data = await statusRes.json();
        setSystemStatus(data);
      } else {
        throw new Error('Failed to fetch system status');
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  // Acknowledge alert
  const handleAcknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev: Alert[]) => prev.map((alert: Alert) => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  // Connect to SSE for real-time updates
  useEffect(() => {
    const connectToStream = () => {
      setIsConnecting(true);
      
      const eventSource = new EventSource('/api/stream');
      
      eventSource.onopen = () => {
        setIsConnecting(false);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'update') {
            setIsLive(true);
            
            if (data.latestReading) {
              setLiveBpm(data.latestReading.bpm);
              setLiveQuality(data.latestReading.quality);
              setLiveSource(data.latestReading.source);
              setLiveTimestamp(data.latestReading.timestamp);
              
              // Add to readings array with limit
              setReadings((prev: BPMReading[]) => [data.latestReading, ...prev.slice(0, 49)]);
            }
            
            if (data.systemStatus) {
              setSystemStatus(data.systemStatus);
            }
            
            // Reset live indicator after 3 seconds
            setTimeout(() => setIsLive(false), 3000);
          }
        } catch (err) {
          console.error('SSE message parse error:', err);
        }
      };
      
      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err);
        setIsConnecting(true);
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          eventSource.close();
          connectToStream();
        }, 5000);
      };
      
      return eventSource;
    };
    
    const eventSource = connectToStream();
    
    return () => {
      eventSource.close();
    };
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Update stats when readings change
  useEffect(() => {
    setStats(calculatedStats);
  }, [calculatedStats]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchInitialData();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchInitialData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading BPM Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="text-destructive mx-auto h-12 w-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="destructive">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with enhanced controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <HeartPulse className="h-8 w-8 text-primary" />
              BPM Monitoring System
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time heart rate monitoring with Arduino & ThingSpeak failover
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline"
              disabled={isConnecting}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            
            <Button variant="outline" className="relative">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
              {alerts.filter(a => !a.acknowledged).length > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
                  {alerts.filter(a => !a.acknowledged).length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* System Health Indicator */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${
                systemStatus?.systemHealth === 'healthy' ? 'bg-green-500' :
                systemStatus?.systemHealth === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="font-medium">
                System Status: {
                  systemStatus?.systemHealth === 'healthy' ? 'Healthy' :
                  systemStatus?.systemHealth === 'degraded' ? 'Degraded' : 'Critical'
                }
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Failovers: {systemStatus?.failoverCount || 0}</span>
              <span>Cache Health: {systemStatus?.cacheHealthScore ? (systemStatus.cacheHealthScore * 100).toFixed(0) + '%' : '100%'}</span>
              <span>Last Update: {liveTimestamp ? new Date(liveTimestamp).toLocaleTimeString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <StatisticsPanel stats={stats} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live BPM Display */}
            <LiveBPMDisplay
              bpm={liveBpm}
              quality={liveQuality}
              source={liveSource}
              timestamp={liveTimestamp ? new Date(liveTimestamp) : null}
              isLive={isLive}
            />

            {/* Chart */}
            <div className="h-96 bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Heart Rate History</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Last 30 readings</span>
                </div>
              </div>
              
              {readings.length > 0 ? (
                <BPMChart readings={readings.slice(0, 30).reverse()} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>

            {/* Report Generator */}
            <ReportGenerator deviceId={primaryDeviceId} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* System Status */}
            <SystemStatusIndicator status={systemStatus} />

            {/* Device Status */}
            <DeviceStatusPanel devices={devices} />

            {/* Alerts */}
            <AlertsPanel alerts={alerts} onAcknowledge={handleAcknowledgeAlert} />
          </div>
        </div>
      </div>
    </div>
  );
}