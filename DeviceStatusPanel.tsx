"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Activity, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Device {
  deviceId: string;
  name: string;
  type: string;
  status: string;
  lastHeartbeat: Date;
}

interface DeviceStatusPanelProps {
  devices: Device[];
}

export default function DeviceStatusPanel({ devices }: DeviceStatusPanelProps) {
  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-500' : 'bg-gray-500';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Server className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Device Status</h3>
      </div>

      <div className="space-y-3">
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No devices registered
          </p>
        ) : (
          devices.map((device) => (
            <div
              key={device.deviceId}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${getStatusColor(device.status)} ${
                      device.status === 'online' ? 'animate-pulse' : ''
                    }`}
                  />
                  <div>
                    <p className="font-medium text-sm">{device.name}</p>
                    <p className="text-xs text-muted-foreground">{device.deviceId}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={device.type === 'arduino' ? 'default' : 'secondary'}>
                  {device.type}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(device.lastHeartbeat), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
