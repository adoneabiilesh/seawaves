// Fix connection string for migrations - Version 2
// Handles all Supabase connection string formats

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// Extract DATABASE_URL
const urlMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
if (!urlMatch) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const currentUrl = urlMatch[1];
console.log('Current connection:', currentUrl.replace(/:[^:@]+@/, ':****@'));
console.log('');

// Check if it's already a direct connection
if (currentUrl.includes('supabase.co:5432') && !currentUrl.includes('pooler')) {
  console.log('✅ Already using direct connection');
  process.exit(0);
}

// Convert pooler to direct connection
let newUrl = currentUrl;

// Pattern 1: pooler.supabase.com:6543 or pooler.supabase.com:5432
if (currentUrl.includes('pooler.supabase.com')) {
  // Extract project ref from pooler URL
  // Format: postgres.REF:password@pooler.supabase.com
  const refMatch = currentUrl.match(/postgres\.([^:]+):/);
  if (refMatch) {
    const projectRef = refMatch[1];
    // Convert to direct: aws-1-eu-west-1.supabase.co:5432
    newUrl = currentUrl
      .replace(/pooler\.supabase\.com:\d+/, 'supabase.co:5432')
      .replace(/aws-1-eu-west-1\.pooler\.supabase\.com:\d+/, 'aws-1-eu-west-1.supabase.co:5432');
    
    // Also try the project ref format
    // postgres.REF:password@aws-REGION.supabase.co:5432
    if (currentUrl.includes('aws-1-eu-west-1')) {
      newUrl = currentUrl.replace(
        /@aws-1-eu-west-1\.pooler\.supabase\.com:\d+/,
        '@aws-1-eu-west-1.supabase.co:5432'
      );
    }
  }
}

// Pattern 2: aws-REGION.pooler.supabase.com
if (currentUrl.includes('.pooler.supabase.com')) {
  newUrl = currentUrl.replace(/\.pooler\.supabase\.com:\d+/, '.supabase.co:5432');
}

// Ensure sslmode is included
if (!newUrl.includes('sslmode')) {
  newUrl += (newUrl.includes('?') ? '&' : '?') + 'sslmode=require';
}

// Remove pgbouncer parameters if present
newUrl = newUrl.replace(/[?&]pgbouncer=[^&]*/g, '');
newUrl = newUrl.replace(/[?&]connection_limit=[^&]*/g, '');

console.log('🔧 Converting to direct connection...\n');
console.log('Old:', currentUrl.replace(/:[^:@]+@/, ':****@'));
console.log('New:', newUrl.replace(/:[^:@]+@/, ':****@'));
console.log('');

// Backup
const backupPath = envPath + '.backup';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, envContent);
  console.log('✅ Backup created: .env.backup\n');
}

// Update .env
const updatedContent = envContent.replace(
  /DATABASE_URL=["']?[^"'\n]+["']?/,
  `DATABASE_URL="${newUrl}"`
);

fs.writeFileSync(envPath, updatedContent);
console.log('✅ Updated .env with direct connection\n');
console.log('📝 Now try running:');
console.log('   npx prisma migrate dev --name add_ratings_reviews_sessions_location\n');





