"use client";

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BPMReading {
  timestamp: Date;
  bpm: number;
  source: string;
  quality: string;
}

interface BPMChartProps {
  readings: BPMReading[];
  title?: string;
}

export default function BPMChart({ readings, title = 'BPM Over Time' }: BPMChartProps) {
  const data = {
    labels: readings.map((r) => format(new Date(r.timestamp), 'HH:mm:ss')),
    datasets: [
      {
        label: 'BPM',
        data: readings.map((r) => r.bpm),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: readings.map((r) => {
          if (r.quality === 'critical') return 'rgb(239, 68, 68)';
          if (r.quality === 'warning') return 'rgb(251, 146, 60)';
          return 'rgb(34, 197, 94)';
        }),
        pointBorderColor: readings.map((r) => {
          if (r.quality === 'critical') return 'rgb(239, 68, 68)';
          if (r.quality === 'warning') return 'rgb(251, 146, 60)';
          return 'rgb(34, 197, 94)';
        }),
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const reading = readings[context.dataIndex];
            return [
              `BPM: ${reading.bpm}`,
              `Source: ${reading.source}`,
              `Quality: ${reading.quality}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 40,
        max: 140,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function (value: any) {
            return value + ' BPM';
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div className="h-full w-full">
      <Line data={data} options={options} />
    </div>
  );
}
