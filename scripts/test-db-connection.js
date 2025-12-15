// Test database connection
// Run: node scripts/test-db-connection.js

require('dotenv').config({ path: '.env' });

async function testConnection() {
  console.log('🔍 Testing database connection...\n');
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    console.log('\n💡 Create a .env file with:');
    console.log('DATABASE_URL="postgresql://postgres:password@host:port/database"');
    process.exit(1);
  }
  
  // Mask password in output
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log('Connection string:', maskedUrl);
  console.log('');
  
  try {
    // Try to import Prisma Client
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error'],
    });
    
    console.log('⏳ Attempting connection (timeout: 10 seconds)...');
    
    // Set timeout
    const timeout = setTimeout(() => {
      console.error('\n❌ Connection timeout after 10 seconds');
      console.error('\n💡 Common issues:');
      console.error('1. Wrong port - try 6543 (direct) or 5432 (pooler)');
      console.error('2. Password needs URL encoding (special characters)');
      console.error('3. Database server not accessible');
      console.error('4. Firewall blocking connection');
      console.error('5. Supabase project might be paused');
      process.exit(1);
    }, 10000);
    
    // Test connection
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    clearTimeout(timeout);
    const endTime = Date.now();
    
    console.log(`✅ Connection successful! (${endTime - startTime}ms)`);
    
    // Try to get database info
    try {
      const result = await prisma.$queryRaw`
        SELECT version() as version
      `;
      console.log('✅ Database version:', result[0]?.version?.substring(0, 50) + '...');
    } catch (e) {
      // Ignore if query fails
    }
    
    await prisma.$disconnect();
    console.log('\n✅ All tests passed! You can now run migrations.');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('P1001') || error.message.includes('Can\'t reach')) {
      console.error('\n💡 Connection Issues:');
      console.error('1. Check if Supabase project is active (not paused)');
      console.error('2. Verify connection string format');
      console.error('3. Try port 6543 (direct) instead of 5432 (pooler)');
      console.error('4. Check firewall/network settings');
      console.error('5. URL encode special characters in password');
    }
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('\n💡 Authentication Issues:');
      console.error('1. Verify password is correct');
      console.error('2. URL encode special characters:');
      console.error('   @ → %40, # → %23, $ → %24, % → %25');
      console.error('   & → %26, + → %2B, = → %3D');
    }
    
    process.exit(1);
  }
}

testConnection();





