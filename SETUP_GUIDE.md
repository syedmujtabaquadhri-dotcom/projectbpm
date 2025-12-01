# BPM Monitoring System - Quick Start Guide

## 🚀 System Overview

You now have a fully functional **Hybrid BPM Monitoring System** with:

✅ **Real-time Dashboard** - Live heart rate monitoring with auto-updates via SSE
✅ **Automatic Failover** - Arduino → ThingSpeak → Cache with 60s heartbeat detection
✅ **Processing Engine** - 5-point moving average filter, quality detection (50-120 BPM thresholds)
✅ **Alert System** - Automatic alerts for critical BPM values with SMS notifications (Twilio)
✅ **PDF Reports** - Generate detailed reports with graphs, statistics, and color-coded sources
✅ **Device Management** - Track multiple Arduino and ThingSpeak devices
✅ **RESTful API** - Complete API for data ingestion and retrieval

## 📋 Prerequisites

1. **MongoDB** - Local instance or MongoDB Atlas connection
2. **Node.js/Bun** - Already installed
3. **Twilio Account** (Optional) - For SMS alerts

## 🔧 Initial Setup

### Step 1: Configure Database

Update your `.env` file with your MongoDB connection string:

```env
DATABASE_URL="mongodb://localhost:27017/bpm-monitoring"
# OR use MongoDB Atlas:
# DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/bpm-monitoring"
```

### Step 2: Initialize Database

Run these commands to set up your database schema:

```bash
# Push schema to MongoDB
npx prisma db push

# (Optional) Seed with sample data
npm run db:seed
```

### Step 3: Configure SMS Alerts (Optional)

If you want SMS notifications for critical alerts:

1. Sign up at [Twilio.com](https://www.twilio.com)
2. Get your credentials from the Twilio Console
3. Add to `.env`:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
ALERT_PHONE_NUMBER=+1234567890  # Your phone for alerts
```

### Step 4: Start the Application

```bash
npm run dev
# or
bun dev
```

Visit **http://localhost:3000** to see your dashboard!

## 🔌 Arduino Integration

### Send BPM Data from Arduino

Use this endpoint to send heart rate readings:

**POST** `http://your-server.com/api/bpm-data`

```json
{
  "deviceId": "ARDUINO_UNO_001",
  "bpm": 75,
  "source": "arduino",
  "metadata": {
    "sensorType": "pulse",
    "voltage": 3.3
  }
}
```

### Arduino Code Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "http://your-server.com/api/bpm-data";

void sendBPM(int bpm) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"deviceId\":\"ARDUINO_UNO_001\",\"bpm\":" + 
                     String(bpm) + ",\"source\":\"arduino\"}";
    
    int httpCode = http.POST(payload);
    Serial.println("Response: " + String(httpCode));
    http.end();
  }
}

void loop() {
  int bpm = readHeartRateSensor(); // Your sensor code
  sendBPM(bpm);
  delay(2000); // Send every 2 seconds
}
```

## 🌐 ThingSpeak Integration

### Setup ThingSpeak Backup

1. Create a channel on [ThingSpeak.com](https://thingspeak.com)
2. Set **Field 1** to "BPM"
3. Note your **Channel ID** and **Read API Key**
4. Register the device:

```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "THINGSPEAK_BACKUP",
    "name": "ThingSpeak Backup Channel",
    "type": "thingspeak",
    "channelId": "YOUR_CHANNEL_ID",
    "apiKey": "YOUR_READ_API_KEY"
  }'
```

### Sync ThingSpeak Data

```bash
# Manual sync
curl -X POST http://localhost:3000/api/thingspeak-sync \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "YOUR_CHANNEL_ID",
    "apiKey": "YOUR_READ_API_KEY",
    "results": 10
  }'

# Auto-sync (polls latest reading)
curl http://localhost:3000/api/thingspeak-sync?channelId=YOUR_CHANNEL_ID
```

## 🧪 Testing the System

### 1. Register Devices

```bash
# Register Arduino
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ARDUINO_UNO_001",
    "name": "Primary Arduino Sensor",
    "type": "arduino"
  }'
```

### 2. Send Test BPM Data

```bash
# Normal reading
curl -X POST http://localhost:3000/api/bpm-data \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ARDUINO_UNO_001",
    "bpm": 75,
    "source": "arduino"
  }'

# Critical high reading (triggers alert)
curl -X POST http://localhost:3000/api/bpm-data \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ARDUINO_UNO_001",
    "bpm": 125,
    "source": "arduino"
  }'

# Critical low reading (triggers alert)
curl -X POST http://localhost:3000/api/bpm-data \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ARDUINO_UNO_001",
    "bpm": 45,
    "source": "arduino"
  }'
```

### 3. View Data

```bash
# Get all readings
curl http://localhost:3000/api/bpm-data

# Get specific device readings
curl http://localhost:3000/api/bpm-data?deviceId=ARDUINO_UNO_001&limit=20

# Get system status
curl http://localhost:3000/api/system-status

# Get alerts
curl http://localhost:3000/api/alerts
```

### 4. Generate PDF Report

```bash
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ARDUINO_UNO_001"
  }' --output report.pdf
```

## 📊 Dashboard Features

### Live BPM Display
- Real-time heart rate with color-coded quality indicators
- Source badge (Arduino/ThingSpeak/Cache)
- Live pulse animation when receiving data
- Last update timestamp

### Historical Chart
- Interactive line chart (Chart.js)
- Color-coded points: Green (good), Orange (warning), Red (critical)
- Hover tooltips with detailed information
- Shows last 30 readings

### System Status Indicator
- **Active Source**: Shows which data source is currently active
- **Failover Count**: Tracks how many times system has switched sources
- **Health Status**: Real-time status of Arduino and ThingSpeak
- **Heartbeat Timestamps**: Last communication time for each source

### Device Status Panel
- List of all registered devices
- Online/offline status with pulse animations
- Device type badges
- Last heartbeat timestamps

### Alerts Panel
- Real-time alert notifications
- Severity levels: Info, Warning, Critical
- One-click acknowledge functionality
- Alert types: high_bpm, low_bpm, device_offline, source_failover

### Statistics Panel
- Average BPM (24h)
- Min/Max BPM
- Total readings count
- Visual stat cards

### Report Generator
- Custom date range selection
- PDF generation with charts and stats
- Optional SMS delivery
- Download instantly

## 🔄 Failover System

### How It Works

1. **Primary Source: Arduino** (Priority 1)
   - System expects heartbeat every 60 seconds
   - Direct sensor readings for highest accuracy

2. **Secondary Source: ThingSpeak** (Priority 2)
   - Activated if Arduino timeout > 60 seconds
   - Cloud-based backup with 120-second timeout

3. **Tertiary Source: Cache** (Priority 3)
   - Last resort if both sources fail
   - Uses last 10 readings stored in memory

### Automatic Recovery

- System continuously monitors all sources
- Automatically returns to higher priority when available
- Seamless transitions without data loss
- Failover events logged and alerted

### Testing Failover

```bash
# Stop sending Arduino data for 60+ seconds
# Watch dashboard switch to ThingSpeak or Cache
# System Status panel will show the active source change
```

## 🔔 Alert Thresholds

### BPM Ranges

| Range | Quality | Color | Action |
|-------|---------|-------|--------|
| < 50 | Critical | Red | SMS Alert + Dashboard Alert |
| 50-60 | Warning | Orange | Dashboard Alert |
| 60-100 | Good | Green | Normal monitoring |
| 100-120 | Warning | Orange | Dashboard Alert |
| > 120 | Critical | Red | SMS Alert + Dashboard Alert |

### Alert Types

- **high_bpm**: BPM exceeds 120
- **low_bpm**: BPM below 50
- **device_offline**: Device hasn't sent data in timeout period
- **source_failover**: System switched data sources

## 📱 Real-time Updates

The dashboard uses **Server-Sent Events (SSE)** for live updates:

- New BPM readings appear instantly
- System status updates every 2 seconds
- No page refresh needed
- Automatic reconnection on disconnect

## 🗄️ API Reference

### Complete API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bpm-data` | Submit new BPM reading |
| GET | `/api/bpm-data` | Retrieve readings (with filters) |
| POST | `/api/thingspeak-sync` | Sync from ThingSpeak |
| GET | `/api/thingspeak-sync?channelId=X` | Auto-sync ThingSpeak |
| GET | `/api/devices` | List all devices |
| POST | `/api/devices` | Register new device |
| GET | `/api/alerts` | Get alerts (with filters) |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| GET | `/api/system-status` | Get failover status |
| POST | `/api/reports/generate` | Generate PDF report |
| GET | `/api/stream` | SSE stream for real-time updates |

## 🐛 Troubleshooting

### Dashboard shows "No Data"

1. Check MongoDB is running
2. Verify DATABASE_URL in `.env`
3. Run `npx prisma db push`
4. Send test data via API
5. Check browser console for errors

### Arduino not connecting

1. Verify WiFi credentials
2. Check server URL is accessible from Arduino network
3. Test API endpoint with curl first
4. Check Arduino Serial Monitor for errors
5. Verify firewall allows connections

### ThingSpeak not syncing

1. Verify Channel ID and API Key are correct
2. Check ThingSpeak channel has data in Field 1
3. Test sync endpoint manually with curl
4. Check API rate limits (ThingSpeak has limits)

### SMS not sending

1. Verify Twilio credentials in `.env`
2. Check phone number format: +1234567890
3. Ensure Twilio account has credits
4. Check server logs for Twilio errors
5. Test with Twilio Console first

### Failover not working

1. Check system-status endpoint
2. Verify heartbeat timestamps
3. Wait full timeout period (60s for Arduino)
4. Check alerts panel for failover notifications

## 📚 Additional Resources

- **Full Documentation**: See `README_BPM_SYSTEM.md`
- **Prisma Schema**: `prisma/schema.prisma`
- **Environment Example**: `.env.example`
- **Database Seeder**: `prisma/seed.ts`

## 🎯 Next Steps

1. **Set up MongoDB** and run `npx prisma db push`
2. **Seed sample data** with `npm run db:seed`
3. **Test the dashboard** at http://localhost:3000
4. **Send test BPM data** using curl commands above
5. **Connect your Arduino** using the example code
6. **Configure ThingSpeak** for backup source
7. **Set up SMS alerts** with Twilio (optional)

## 🔐 Production Deployment

Before deploying to production:

1. ✅ Use MongoDB Atlas for reliable cloud database
2. ✅ Set strong DATABASE_URL connection string
3. ✅ Add authentication (JWT recommended)
4. ✅ Enable HTTPS for Arduino communication
5. ✅ Configure CORS properly
6. ✅ Set up API rate limiting
7. ✅ Monitor system logs
8. ✅ Set up backup strategy

## 💡 Tips

- **Keep Arduino sending data** every 2-5 seconds for best real-time experience
- **Monitor failover count** - frequent failovers indicate connectivity issues
- **Acknowledge alerts** to keep dashboard clean
- **Generate reports weekly** for trend analysis
- **Test failover regularly** to ensure backup systems work
- **Use cache as last resort** only - it's limited to last 10 readings

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs: `check_server_logs` tool
3. Test API endpoints individually with curl
4. Verify MongoDB connection
5. Check browser console for frontend errors

---

**System is ready! 🎉**

Your BPM Monitoring System is now fully operational with automatic failover, real-time dashboard, alerts, and comprehensive data management.
