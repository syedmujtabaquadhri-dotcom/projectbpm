import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Try to connect to the database
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Try to fetch some data
    const devices = await prisma.device.findMany();
    console.log(`✅ Found ${devices.length} devices`);
    
    // Try to fetch BPM readings
    const readings = await prisma.bpmReading.findMany({ take: 5 });
    console.log(`✅ Found ${readings.length} BPM readings`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();