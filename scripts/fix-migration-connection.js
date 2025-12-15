// Fix connection string for migrations
// This converts pooler connection to direct connection

const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// Check if it's a pooler connection
if (envContent.includes('pooler.supabase.com')) {
  console.log('🔧 Converting pooler connection to direct connection for migrations...\n');
  
  // Convert pooler to direct
  const directUrl = envContent
    .match(/DATABASE_URL="([^"]+)"/)?.[1]
    ?.replace(/pooler\.supabase\.com:6543/g, 'supabase.co:5432')
    ?.replace(/aws-1-eu-west-1\.pooler\.supabase\.com:6543/g, 'aws-1-eu-west-1.supabase.co:5432');
  
  if (directUrl) {
    // Backup original
    const backupPath = envPath + '.backup';
    fs.writeFileSync(backupPath, envContent);
    console.log('✅ Backup created: .env.backup\n');
    
    // Update with direct connection
    envContent = envContent.replace(
      /DATABASE_URL="[^"]+"/,
      `DATABASE_URL="${directUrl}"`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env with direct connection');
    console.log('   Changed: pooler.supabase.com:6543 → supabase.co:5432\n');
    console.log('📝 You can now run migrations:');
    console.log('   npx prisma migrate dev --name add_ratings_reviews_sessions_location\n');
    console.log('💡 Note: After migrations, you may want to switch back to pooler for app runtime.');
  } else {
    console.error('❌ Could not parse DATABASE_URL');
    process.exit(1);
  }
} else if (envContent.includes('supabase.co:5432')) {
  console.log('✅ Already using direct connection (good for migrations)');
} else {
  console.log('⚠️  Connection string doesn\'t appear to be Supabase pooler');
  console.log('   If you\'re still getting errors, check FIX_MIGRATION_ERROR.md');
}





