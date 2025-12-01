"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: string;
  acknowledged: boolean;
  createdAt: Date;
  bpmValue?: number;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
}

export default function AlertsPanel({ alerts, onAcknowledge }: AlertsPanelProps) {
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const handleAcknowledge = async (id: string) => {
    setAcknowledging(id);
    try {
      const response = await fetch(`/api/alerts/${id}/acknowledge`, {
        method: 'PATCH',
      });
      if (response.ok && onAcknowledge) {
        onAcknowledge(id);
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setAcknowledging(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'destructive';
    if (severity === 'warning') return 'default';
    return 'secondary';
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return <AlertTriangle className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Alerts</h3>
        </div>
        {unacknowledgedAlerts.length > 0 && (
          <Badge variant="destructive">{unacknowledgedAlerts.length} New</Badge>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No alerts</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 border rounded-lg ${
                !alert.acknowledged ? 'bg-muted/30 border-orange-300' : ''
              }`}
            >
              <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {alert.type.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!alert.acknowledged && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={acknowledging === alert.id}
                >
                  {acknowledging === alert.id ? 'Acknowledging...' : 'Acknowledge'}
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
