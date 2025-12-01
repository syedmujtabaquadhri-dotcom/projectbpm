import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { devices, bpmReadings, alerts, systemStatus } from './src/db/schema';

// Create a client and drizzle instance using local SQLite file for development
const client = createClient({
  url: 'file:local.db',
});

const db = drizzle(client);

async function seed() {
  console.log('Seeding database...');
  
  try {
    // Create Arduino device
    const arduinoDevice = await db.insert(devices).values({
      deviceId: 'ARDUINO_UNO_001',
      name: 'Primary Arduino Sensor',
      type: 'arduino',
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      firmwareVersion: '1.2.3',
      batteryLevel: 85
    }).onConflictDoNothing().returning();
    
    console.log('Created Arduino device:', arduinoDevice[0]?.deviceId || 'ARDUINO_UNO_001');
    
    // Create ThingSpeak device
    const thingspeakDevice = await db.insert(devices).values({
      deviceId: 'THINGSPEAK_BACKUP',
      name: 'ThingSpeak Backup',
      type: 'thingspeak',
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      channelId: '000000',
      apiKey: 'YOUR_API_KEY'
    }).onConflictDoNothing().returning();
    
    console.log('Created ThingSpeak device:', thingspeakDevice[0]?.deviceId || 'THINGSPEAK_BACKUP');
    
    // Create system status
    const existingStatus = await db.select().from(systemStatus).limit(1);
    if (existingStatus.length === 0) {
      const statusResult = await db.insert(systemStatus).values({
        activeSource: 'arduino',
        lastArduinoHeartbeat: new Date().toISOString(),
        lastThingSpeakSync: new Date().toISOString(),
        failoverCount: 0,
        updatedAt: new Date().toISOString(),
        systemHealth: 'healthy',
        cacheHealthScore: 0.95
      }).returning();
      
      console.log('Created initial system status');
    }
    
    // Generate sample BPM readings for the last 24 hours
    const now = new Date();
    const readings = [];
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000); // Every 30 minutes
      const bpm = Math.floor(70 + Math.random() * 30); // 70-100 BPM
      const quality = bpm < 60 || bpm > 100 ? 'warning' : 'good';
      
      readings.push({
        deviceId: 'ARDUINO_UNO_001',
        bpm,
        source: i % 10 === 0 ? 'thingspeak' : 'arduino', // Some ThingSpeak readings
        quality,
        timestamp: timestamp.toISOString(),
        processedBpm: bpm + (Math.random() * 2 - 1), // Slight variation
        confidence: 0.95,
        isAnomaly: false,
        rateOfChange: 0.1
      });
    }
    
    const insertedReadings = await db.insert(bpmReadings).values(readings).onConflictDoNothing().returning();
    console.log(`Created ${insertedReadings.length} sample BPM readings`);
    
    // Create sample alerts
    const alertData = [
      {
        deviceId: 'ARDUINO_UNO_001',
        type: 'high_bpm',
        message: 'BPM reading of 125 exceeds threshold of 120',
        bpmValue: 125,
        severity: 'critical',
        acknowledged: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        deviceId: 'ARDUINO_UNO_001',
        type: 'source_failover',
        message: 'System failover: Switched to thingspeak data source',
        severity: 'warning',
        acknowledged: true,
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        deviceId: 'ARDUINO_UNO_001',
        type: 'low_bpm',
        message: 'BPM reading of 45 below threshold of 50',
        bpmValue: 45,
        severity: 'critical',
        acknowledged: false,
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ];
    
    const insertedAlerts = await db.insert(alerts).values(alertData).onConflictDoNothing().returning();
    console.log(`Created ${insertedAlerts.length} sample alerts`);
    
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seed();