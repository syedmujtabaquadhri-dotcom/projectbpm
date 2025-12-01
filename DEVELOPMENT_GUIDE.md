# BPM Monitoring System - Development Guide

This guide provides comprehensive information for developers working on the Hybrid BPM Monitoring System.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
6. [Core Components](#core-components)
7. [Development Guidelines](#development-guidelines)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## System Architecture

The BPM Monitoring System follows a hybrid architecture with multiple data sources and automatic failover capabilities:

```
┌─────────────────────────────────────────────────────────────┐
│                    HYBRID BPM MONITORING SYSTEM             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Arduino    │───▶│  Processing  │───▶│   Database   │ │
│  │   UNO (1°)   │    │    Engine    │    │   (SQLite)   │ │
│  └──────────────┘    │              │    └──────────────┘ │
│                      │  • Filter    │                      │
│  ┌──────────────┐    │  • Validate  │    ┌──────────────┐ │
│  │ ThingSpeak   │───▶│  • Alerts    │───▶│     SMS      │ │
│  │  Backup (2°) │    │  • Failover  │    │   (Twilio)   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                             │                              │
│  ┌──────────────┐           └────────────▶│  Dashboard   │ │
│  │  In-Memory   │                         │  (Real-time) │ │
│  │  Cache (3°)  │                         └──────────────┘ │
│  └──────────────┘                                          │
│                                                              │
│  Automatic Failover: Arduino → ThingSpeak → Cache          │
│  Heartbeat Detection: 60s timeout                          │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS framework
- **Shadcn/UI** - Component library
- **Chart.js** - Data visualization
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Drizzle ORM** - Database ORM
- **Turso (libSQL)** - SQLite-based database
- **Server-Sent Events** - Real-time updates

### Services
- **Twilio** - SMS notifications
- **jsPDF** - PDF generation
- **Axios** - HTTP client

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── alerts/        # Alert management
│   │   ├── bpm-data/      # BPM data handling
│   │   ├── devices/       # Device management
│   │   ├── reports/       # Report generation
│   │   ├── stream/        # Real-time streaming
│   │   ├── system-status/ # System status
│   │   └── thingspeak/    # ThingSpeak integration
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── ui/                # Shadcn/UI components
│   ├── AlertsPanel.tsx    # Alerts display
│   ├── BPMChart.tsx       # Chart visualization
│   ├── BPMDashboard.tsx   # Main dashboard
│   ├── DeviceStatus.tsx   # Device status panel
│   ├── LiveBPMDisplay.tsx # Live BPM display
│   ├── ReportGenerator.tsx # PDF report generator
│   ├── StatisticsPanel.tsx # Statistics display
│   └── SystemStatus.tsx   # System status indicator
├── db/                    # Database schema and connection
│   ├── index.ts           # Database connection
│   └── schema.ts          # Database schema
├── lib/                   # Utility libraries
│   ├── bpm-processor.ts   # BPM data processing
│   ├── db.ts              # Database utilities
│   ├── pdf-generator.ts   # PDF report generation
│   ├── security.ts        # Security utilities
│   ├── sms-service.ts     # SMS notifications
│   └── utils.ts           # General utilities
└── types/                 # TypeScript types
```

## Data Models

### Devices
```typescript
interface Device {
  id: number;
  deviceId: string;        // Unique identifier
  name: string;            // Human-readable name
  type: 'arduino' | 'thingspeak';
  status: 'online' | 'offline';
  lastHeartbeat: string;   // ISO timestamp
  apiKey?: string;         // ThingSpeak API key
  channelId?: string;      // ThingSpeak channel ID
  createdAt: string;       // ISO timestamp
}
```

### BPM Readings
```typescript
interface BPMReading {
  id: number;
  deviceId: string;
  bpm: number;             // Heart rate value (30-250)
  source: 'arduino' | 'thingspeak' | 'cache';
  quality: 'good' | 'warning' | 'critical';
  timestamp: string;       // ISO timestamp
  processedBpm?: number;   // Filtered value
  metadata?: any;          // Additional data
  confidence: number;      // Data confidence (0.0-1.0)
  isAnomaly: boolean;      // Statistical anomaly flag
  rateOfChange?: number;   // BPM change per second
  readingStatus: 'normal' | 'anomaly' | 'outlier';
}
```

### Alerts
```typescript
interface Alert {
  id: number;
  deviceId: string;
  type: string;            // 'high_bpm', 'low_bpm', 'anomaly', etc.
  message: string;         // Alert description
  bpmValue?: number;       // Associated BPM value
  severity: 'info' | 'warning' | 'critical';
  acknowledged: boolean;
  createdAt: string;       // ISO timestamp
  resolvedAt?: string;     // ISO timestamp
  resolvedBy?: string;     // User who resolved
}
```

### System Status
```typescript
interface SystemStatus {
  id: number;
  activeSource: 'arduino' | 'thingspeak' | 'cache';
  lastArduinoHeartbeat: string;  // ISO timestamp
  lastThingSpeakSync: string;    // ISO timestamp
  failoverCount: number;         // Number of failovers
  updatedAt: string;             // ISO timestamp
  systemHealth: 'healthy' | 'degraded' | 'critical';
  lastFailoverReason?: string;
  cacheHealthScore: number;      // 0.0-1.0
}
```

## API Endpoints

### BPM Data
- `GET /api/bpm-data` - Retrieve BPM readings
- `GET /api/bpm-data?id={id}` - Retrieve specific reading
- `POST /api/bpm-data` - Create new BPM reading

### Devices
- `GET /api/devices` - List devices
- `GET /api/devices?id={id}` - Get specific device
- `POST /api/devices` - Create new device
- `POST /api/devices/heartbeat` - Update device heartbeat

### Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts/acknowledge` - Acknowledge alert
- `POST /api/alerts/{id}/acknowledge` - Acknowledge specific alert

### System Status
- `GET /api/system-status` - Get current system status
- `POST /api/system-status/failover` - Trigger failover

### Reports
- `POST /api/reports/generate` - Generate PDF report

### Real-time Streaming
- `GET /api/stream` - Server-Sent Events stream

## Core Components

### BPMProcessor
The core processing engine responsible for:
- Data validation and filtering
- Quality determination
- Anomaly detection
- Alert generation
- Failover management

### Dashboard Components
- **BPMDashboard** - Main dashboard container
- **LiveBPMDisplay** - Real-time BPM display
- **BPMChart** - Historical data visualization
- **DeviceStatusPanel** - Device monitoring
- **AlertsPanel** - Alert management
- **SystemStatusIndicator** - System health monitoring
- **StatisticsPanel** - Data statistics
- **ReportGenerator** - PDF report creation

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow functional programming principles
- Use descriptive variable and function names
- Write JSDoc comments for public APIs
- Keep functions small and focused

### Error Handling
- Always use try/catch blocks for async operations
- Log errors with context information
- Provide user-friendly error messages
- Implement retry logic for transient failures

### Security
- Validate all input data
- Implement rate limiting
- Sanitize user input
- Use environment variables for secrets

### Performance
- Implement caching for expensive operations
- Use database indexes for frequently queried fields
- Optimize database queries
- Minimize API response sizes

## Testing

### Unit Tests
Create tests for:
- Data validation functions
- Processing algorithms
- Utility functions
- Component rendering

### Integration Tests
Test:
- API endpoints
- Database operations
- External service integrations

### End-to-End Tests
Verify:
- User workflows
- Dashboard functionality
- Alert generation and handling

## Deployment

### Environment Variables
Required environment variables:
```env
TURSO_CONNECTION_URL=your_database_url
TURSO_AUTH_TOKEN=your_auth_token
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
ALERT_PHONE_NUMBER=alert_recipient_number
```

### Database Setup
1. Run `npx drizzle-kit push` to create database schema
2. Seed initial data if needed

### Production Deployment
1. Build the application: `npm run build`
2. Start the server: `npm run start`
3. Configure reverse proxy (Nginx, Apache, etc.)
4. Set up SSL certificates
5. Monitor logs and performance

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN
- Check network connectivity to database
- Ensure database instance is running

#### API Rate Limiting
- Implement exponential backoff for retries
- Check client IP rate limits
- Consider upgrading service tier

#### Data Processing Issues
- Validate input data formats
- Check for sensor malfunctions
- Review processing algorithm parameters

#### Dashboard Not Updating
- Verify SSE connection
- Check browser console for errors
- Confirm database connectivity

### Logging
The system uses structured logging with context:
- `[CONTEXT] TIMESTAMP LEVEL: MESSAGE`
- Context examples: BPM_PROCESSOR, DB, API_BPM_DATA
- Log levels: INFO, WARN, ERROR

### Monitoring
Key metrics to monitor:
- API response times
- Database query performance
- Error rates
- System health status
- Alert generation frequency

## Contributing

### Git Workflow
1. Fork the repository
2. Create feature branch
3. Make changes
4. Write tests
5. Commit with descriptive messages
6. Push to fork
7. Create pull request

### Code Review Process
- All changes require review
- Follow style guidelines
- Ensure test coverage
- Verify documentation updates

This guide will be updated as the system evolves. Check back regularly for the latest information.