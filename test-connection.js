// Quick script to test PostgreSQL connection
// Run: node test-connection.js

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('Testing database connection...');
    console.log('Connection string:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    
    const startTime = Date.now();
    
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1 as test`;
    
    const endTime = Date.now();
    console.log(`✅ Connection successful! (${endTime - startTime}ms)`);
    
    // Test if we can read from database
    const tableCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('✅ Database is accessible');
    console.log('Tables found:', tableCount[0]?.count || 0);
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('P1001')) {
      console.error('\n💡 Tips:');
      console.error('1. Check if your database server is running');
      console.error('2. Verify your connection string in .env');
      console.error('3. Check firewall/network settings');
      console.error('4. Try different port (6543 vs 5432)');
      console.error('5. URL encode special characters in password');
    }
    
    if (error.message.includes('password')) {
      console.error('\n💡 Password issue:');
      console.error('1. Check if password is correct');
      console.error('2. URL encode special characters (@, #, $, %, &, +, =)');
      console.error('3. Example: @ becomes %40');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();





