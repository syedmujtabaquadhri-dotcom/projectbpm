"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveBPMDisplayProps {
  bpm: number | null;
  quality: string;
  source: string;
  timestamp: Date | null;
  isLive: boolean;
}

export default function LiveBPMDisplay({
  bpm,
  quality,
  source,
  timestamp,
  isLive,
}: LiveBPMDisplayProps) {
  const getQualityColor = () => {
    if (quality === 'critical') return 'text-red-500';
    if (quality === 'warning') return 'text-orange-500';
    return 'text-green-500';
  };

  const getSourceColor = () => {
    if (source === 'arduino') return 'bg-green-500';
    if (source === 'thingspeak') return 'bg-blue-500';
    return 'bg-orange-500';
  };

  const getSourceLabel = () => {
    if (source === 'arduino') return 'Arduino';
    if (source === 'thingspeak') return 'ThingSpeak';
    return 'Cache';
  };

  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Animated background pulse */}
      {isLive && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 animate-pulse" />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className={cn('h-5 w-5', getQualityColor())} />
            <h3 className="text-lg font-semibold">Live BPM</h3>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            )}
            <Badge variant="secondary" className={cn('text-white', getSourceColor())}>
              {getSourceLabel()}
            </Badge>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          {bpm !== null ? (
            <>
              <span className={cn('text-6xl font-bold', getQualityColor())}>
                {bpm}
              </span>
              <span className="text-2xl text-muted-foreground">BPM</span>
            </>
          ) : (
            <span className="text-3xl text-muted-foreground">No Data</span>
          )}
        </div>

        {timestamp && (
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {new Date(timestamp).toLocaleTimeString()}
          </p>
        )}

        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full" />
            <span className="text-muted-foreground">50-120 Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-orange-500 rounded-full" />
            <span className="text-muted-foreground">Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-red-500 rounded-full" />
            <span className="text-muted-foreground">Critical</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
