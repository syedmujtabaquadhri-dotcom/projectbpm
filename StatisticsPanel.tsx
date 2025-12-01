"use client";

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Database } from 'lucide-react';

interface StatisticsPanelProps {
  stats: {
    avgBpm: number;
    minBpm: number;
    maxBpm: number;
    totalReadings: number;
    last24Hours: number;
  } | null;
}

export default function StatisticsPanel({ stats }: StatisticsPanelProps) {
  if (!stats) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Statistics (24h)</h3>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </Card>
    );
  }

  const statCards = [
    {
      label: 'Average BPM',
      value: stats.avgBpm.toFixed(1),
      icon: Activity,
      color: 'text-blue-500',
    },
    {
      label: 'Minimum BPM',
      value: stats.minBpm,
      icon: TrendingDown,
      color: 'text-green-500',
    },
    {
      label: 'Maximum BPM',
      value: stats.maxBpm,
      icon: TrendingUp,
      color: 'text-red-500',
    },
    {
      label: 'Total Readings',
      value: stats.totalReadings,
      icon: Database,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
