"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FileText, Download, Send } from 'lucide-react';
import { useState } from 'react';

interface ReportGeneratorProps {
  deviceId: string;
}

export default function ReportGenerator({ deviceId }: ReportGeneratorProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sendSMS, setSendSMS] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sendSMS,
          phoneNumber: sendSMS ? phoneNumber : undefined,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bpm-report-${deviceId}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Generate Report</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sendSMS" className="cursor-pointer">
            Send via SMS
          </Label>
          <Switch
            id="sendSMS"
            checked={sendSMS}
            onCheckedChange={setSendSMS}
          />
        </div>

        {sendSMS && (
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleGenerateReport}
          disabled={generating}
        >
          {generating ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate PDF Report
            </>
          )}
        </Button>

        {sendSMS && (
          <p className="text-xs text-muted-foreground text-center">
            A download link will be sent to your phone
          </p>
        )}
      </div>
    </Card>
  );
}
