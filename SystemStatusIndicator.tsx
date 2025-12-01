"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Cloud, HardDrive, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface SystemStatus {
  activeSource: string;
  failoverCount: number;
  lastArduinoHeartbeat: Date;
  lastThingSpeakSync: Date;
}

interface SystemStatusIndicatorProps {
  status: SystemStatus | null;
}

export default function SystemStatusIndicator({ status }: SystemStatusIndicatorProps) {
  if (!status) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">System Status</h3>
        </div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  const getSourceIcon = () => {
    if (status.activeSource === 'arduino') return <Database className="h-5 w-5" />;
    if (status.activeSource === 'thingspeak') return <Cloud className="h-5 w-5" />;
    return <HardDrive className="h-5 w-5" />;
  };

  const getSourceColor = () => {
    if (status.activeSource === 'arduino') return 'bg-green-500';
    if (status.activeSource === 'thingspeak') return 'bg-blue-500';
    return 'bg-orange-500';
  };

  const isArduinoHealthy = () => {
    const diff = Date.now() - new Date(status.lastArduinoHeartbeat).getTime();
    return diff < 60000; // 60 seconds
  };

  const isThingSpeakHealthy = () => {
    const diff = Date.now() - new Date(status.lastThingSpeakSync).getTime();
    return diff < 120000; // 120 seconds
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">System Status</h3>
      </div>

      <div className="space-y-4">
        {/* Active Source */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {getSourceIcon()}
            <div>
              <p className="text-sm font-medium">Active Data Source</p>
              <p className="text-xs text-muted-foreground capitalize">
                {status.activeSource}
              </p>
            </div>
          </div>
          <div className={cn('h-3 w-3 rounded-full animate-pulse', getSourceColor())} />
        </div>

        {/* Failover Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Failover Events</span>
          </div>
          <Badge variant={status.failoverCount > 0 ? 'default' : 'secondary'}>
            {status.failoverCount}
          </Badge>
        </div>

        {/* Data Sources Health */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-sm font-medium mb-2">Data Sources Health</p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isArduinoHealthy() ? 'bg-green-500' : 'bg-gray-400'
                )}
              />
              <span>Arduino</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(status.lastArduinoHeartbeat), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isThingSpeakHealthy() ? 'bg-green-500' : 'bg-gray-400'
                )}
              />
              <span>ThingSpeak</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(status.lastThingSpeakSync), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
