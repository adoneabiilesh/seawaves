// Fix pooler connection to work with migrations by disabling prepared statements
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// Find the pooler connection and add pgbouncer=true parameter
const poolerUrl = 'postgresql://postgres.taorpudiapiscrwbmtww:MSbCT7xGaklWYBJA@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require';

// Comment out all DATABASE_URL
envContent = envContent.replace(/^DATABASE_URL=.*$/gm, '#$&');

// Add the pooler with pgbouncer=true (disables prepared statements)
const newUrl = poolerUrl + '&pgbouncer=true';
const newLine = `DATABASE_URL="${newUrl}"`;

// Add after the commented lines
const lines = envContent.split('\n');
let insertIndex = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('#DATABASE_URL')) {
    insertIndex = i + 1;
    break;
  }
}

if (insertIndex > -1) {
  lines.splice(insertIndex, 0, newLine);
} else {
  lines.push(newLine);
}

envContent = lines.join('\n');

fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env to use pooler with pgbouncer=true');
console.log('   This disables prepared statements, allowing migrations\n');
console.log('📝 Now try:');
console.log('   npx prisma migrate dev --name add_ratings_reviews_sessions_location\n');





