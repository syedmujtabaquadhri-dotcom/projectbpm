# Hybrid BPM Monitoring System

A comprehensive heart rate monitoring system with automatic failover between Arduino UNO (primary) and ThingSpeak (backup) data sources.

## Features

✅ **Real-time BPM Monitoring** - Live heart rate display with quality indicators
✅ **Automatic Failover** - Seamlessly switches between Arduino → ThingSpeak → Cache
✅ **60-Second Heartbeat Detection** - Automatic source availability checking
✅ **Moving Average Filter** - Smooths BPM readings using 5-point moving average
✅ **Alert System** - Configurable thresholds (50-120 BPM) with SMS notifications
✅ **PDF Reports** - Generate detailed reports with graphs and statistics
✅ **Real-time Dashboard** - Server-Sent Events (SSE) for live updates
✅ **Device Management** - Track multiple Arduino and ThingSpeak devices
✅ **Color-coded Sources** - Visual indicators for data source status

## Architecture

### Data Flow
1. **Primary Source**: Arduino UNO sends BPM data via POST to `/api/bpm-data`
2. **Backup Source**: ThingSpeak channel synced via `/api/thingspeak-sync`
3. **Failover Logic**: System automatically detects source availability
4. **Cache Fallback**: Last 10 readings stored in-memory as final backup

### Processing Engine
- **Moving Average**: 5-point window for noise reduction
- **Quality Detection**: Automatic classification (good/warning/critical)
- **Alert Generation**: Threshold-based alerts with SMS integration
- **Heartbeat Monitoring**: 60-second timeout for Arduino, 120s for ThingSpeak

## API Endpoints

### Data Collection
- `POST /api/bpm-data` - Receive BPM reading from Arduino
- `GET /api/bpm-data` - Retrieve historical readings
- `POST /api/thingspeak-sync` - Sync data from ThingSpeak
- `GET /api/thingspeak-sync?channelId=XXX` - Auto-sync from channel

### Device Management
- `GET /api/devices` - List all registered devices
- `POST /api/devices` - Register new device

### Alerts
- `GET /api/alerts` - Get alerts (filter by device, acknowledged status)
- `PATCH /api/alerts/:id/acknowledge` - Acknowledge an alert

### System Status
- `GET /api/system-status` - Get current failover state and source health

### Reports
- `POST /api/reports/generate` - Generate PDF report with optional SMS delivery

### Real-time Updates
- `GET /api/stream` - Server-Sent Events stream for live dashboard updates

## Setup Instructions

### 1. Database Setup

```bash
# Start MongoDB (or use MongoDB Atlas)
# Update DATABASE_URL in .env file

# Initialize Prisma
npx prisma generate
npx prisma db push
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="mongodb://localhost:27017/bpm-monitoring"

# Optional: Twilio for SMS alerts
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
ALERT_PHONE_NUMBER=+1234567890
```

### 3. Seed Initial Data (Optional)

Create initial devices and test data:

```bash
# Run the seed script (create this file if needed)
npx prisma db seed
```

Or manually via API:

```bash
# Register Arduino device
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ARDUINO_UNO_001",
    "name": "Primary Arduino Sensor",
    "type": "arduino"
  }'

# Register ThingSpeak backup
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "THINGSPEAK_BACKUP",
    "name": "ThingSpeak Backup",
    "type": "thingspeak",
    "channelId": "YOUR_CHANNEL_ID",
    "apiKey": "YOUR_READ_API_KEY"
  }'
```

### 4. Start the Application

```bash
npm run dev
# or
bun dev
```

Visit http://localhost:3000 to see the dashboard.

## Arduino Integration

### Arduino Code Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://your-server.com/api/bpm-data";
const char* deviceId = "ARDUINO_UNO_001";

void setup() {
  Serial.begin(9600);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
}

void loop() {
  int bpm = readBPMSensor(); // Your sensor reading logic
  
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"deviceId\":\"" + String(deviceId) + 
                     "\",\"bpm\":" + String(bpm) + 
                     ",\"source\":\"arduino\"}";
    
    int httpCode = http.POST(payload);
    Serial.println("HTTP Response: " + String(httpCode));
    
    http.end();
  }
  
  delay(2000); // Send every 2 seconds
}
```

## ThingSpeak Integration

### Setup ThingSpeak Channel
1. Create a channel on ThingSpeak.com
2. Set Field 1 to "BPM"
3. Note your Channel ID and Read API Key
4. Configure auto-sync or manual sync via API

### Auto-sync Configuration
The system can automatically poll ThingSpeak every 2 minutes:

```bash
# Setup a cron job or use the built-in SSE stream
curl http://localhost:3000/api/thingspeak-sync?channelId=YOUR_CHANNEL_ID
```

## Dashboard Features

### Live BPM Display
- Real-time heart rate with color-coded quality
- Source indicator (Arduino/ThingSpeak/Cache)
- Live animation when receiving new data
- Last update timestamp

### Historical Chart
- Interactive line chart with last 30 readings
- Color-coded points based on quality
- Hover tooltips with detailed information
- Responsive design

### System Status Indicator
- Active data source with visual indicator
- Failover count tracking
- Heartbeat status for each source
- Health indicators

### Device Status Panel
- List of all registered devices
- Online/offline status with pulse animation
- Last heartbeat timestamp
- Device type badges

### Alerts Panel
- Real-time alert notifications
- Severity badges (info/warning/critical)
- One-click acknowledge functionality
- Filter by acknowledged status

### Statistics Panel (24h)
- Average BPM
- Min/Max BPM
- Total readings count
- Visual stat cards

### Report Generator
- Custom date range selection
- PDF generation with charts and statistics
- Optional SMS delivery
- Color-coded source indicators in report

## Failover Logic

### Priority Order
1. **Arduino** (Primary) - Direct sensor readings
2. **ThingSpeak** (Secondary) - Cloud backup data
3. **Cache** (Tertiary) - Last 10 in-memory readings

### Automatic Switching
- System checks heartbeats every 2 seconds
- Arduino timeout: 60 seconds
- ThingSpeak timeout: 120 seconds
- Automatic failover alert generation
- SMS notification on critical failover

### Recovery
- System automatically returns to Arduino when available
- Seamless transition without data loss
- Failover count tracked for monitoring

## Alert Thresholds

### BPM Ranges
- **Normal**: 60-100 BPM (green)
- **Warning**: 50-60 or 100-120 BPM (orange)
- **Critical**: <50 or >120 BPM (red)

### Alert Types
- `high_bpm` - BPM exceeds 120
- `low_bpm` - BPM below 50
- `device_offline` - Device heartbeat timeout
- `source_failover` - Data source switched

## SMS Notifications

Configure Twilio credentials in `.env` to enable:
- Critical BPM alerts
- Failover notifications
- PDF report delivery links

## Testing

### Send Test BPM Reading
```bash
curl -X POST http://localhost:3000/api/bpm-data \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ARDUINO_UNO_001",
    "bpm": 75,
    "source": "arduino"
  }'
```

### Generate Test Report
```bash
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ARDUINO_UNO_001"
  }' --output report.pdf
```

### Check System Status
```bash
curl http://localhost:3000/api/system-status
```

## Troubleshooting

### No Data Showing
1. Check MongoDB connection
2. Verify devices are registered
3. Send test BPM reading via API
4. Check browser console for errors

### Arduino Not Connecting
1. Verify WiFi credentials
2. Check server URL is accessible
3. Ensure CORS is not blocking requests
4. Check Arduino serial monitor for errors

### ThingSpeak Not Syncing
1. Verify Channel ID and API Key
2. Check ThingSpeak channel has data in Field 1
3. Test sync endpoint manually
4. Review API rate limits

### SMS Not Sending
1. Verify Twilio credentials in .env
2. Check phone number format (+1234567890)
3. Ensure Twilio account has credits
4. Review server logs for errors

## Technology Stack

- **Frontend**: Next.js 15, React, TailwindCSS, Shadcn/UI
- **Charts**: Chart.js, react-chartjs-2
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MongoDB
- **Real-time**: Server-Sent Events (SSE)
- **PDF**: jsPDF
- **SMS**: Twilio
- **HTTP Client**: Axios

## Security Considerations

- Add authentication for production use
- Implement API rate limiting
- Validate all BPM inputs (0-300 range)
- Sanitize device IDs and metadata
- Use HTTPS for Arduino communication
- Secure MongoDB connection
- Protect Twilio credentials

## Future Enhancements

- [ ] User authentication with JWT
- [ ] Multi-user support with role-based access
- [ ] WebSocket alternative to SSE
- [ ] Mobile app integration
- [ ] Email notifications
- [ ] Advanced analytics and ML predictions
- [ ] Export data to CSV/Excel
- [ ] Configurable alert thresholds per device
- [ ] Historical data retention policies
- [ ] API key management for devices

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact support.
