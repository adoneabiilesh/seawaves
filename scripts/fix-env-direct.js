// Fix .env to use direct connection
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// Backup
const backupPath = envPath + '.backup2';
fs.writeFileSync(backupPath, envContent);
console.log('✅ Backup created: .env.backup2\n');

// Uncomment the direct connection and comment out the pooler
envContent = envContent.replace(
  /#DATABASE_URL="postgresql:\/\/postgres\.taorpudiapiscrwbmtww:MSbCT7xGaklWYBJA@aws-1-eu-west-1\.supabase\.co:5432\/postgres\?sslmode=require"/,
  'DATABASE_URL="postgresql://postgres.taorpudiapiscrwbmtww:MSbCT7xGaklWYBJA@aws-1-eu-west-1.supabase.co:5432/postgres?sslmode=require"'
);

envContent = envContent.replace(
  /DATABASE_URL="postgresql:\/\/postgres\.taorpudiapiscrwbmtww:MSbCT7xGaklWYBJA@aws-1-eu-west-1\.pooler\.supabase\.com:6543\/postgres\?sslmode=require"/,
  '#DATABASE_URL="postgresql://postgres.taorpudiapiscrwbmtww:MSbCT7xGaklWYBJA@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"'
);

fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env file:');
console.log('   - Uncommented direct connection (supabase.co:5432)');
console.log('   - Commented out pooler connection (pooler.supabase.com:6543)\n');

console.log('📝 Now try running:');
console.log('   npx prisma migrate dev --name add_ratings_reviews_sessions_location\n');





