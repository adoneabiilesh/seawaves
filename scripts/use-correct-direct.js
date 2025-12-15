// Use the correct direct connection format
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// The correct direct connection format is: db.REF.supabase.co
// Uncomment this one: postgresql://postgres:MSbCT7xGaklWYBJA@db.taorpudiapiscrwbmtww.supabase.co:5432/postgres

// Comment out all DATABASE_URL lines first
envContent = envContent.replace(/^DATABASE_URL=.*$/gm, '#$&');
envContent = envContent.replace(/^#DATABASE_URL=.*$/gm, (match) => {
  // Uncomment the db.REF.supabase.co one
  if (match.includes('db.taorpudiapiscrwbmtww.supabase.co')) {
    return match.replace(/^#/, '');
  }
  return match;
});

// If the db.REF format wasn't commented, add it
if (!envContent.includes('DATABASE_URL="postgresql://postgres:MSbCT7xGaklWYBJA@db.taorpudiapiscrwbmtww.supabase.co:5432/postgres"')) {
  // Add it as active
  const lines = envContent.split('\n');
  const dbUrlLine = 'DATABASE_URL="postgresql://postgres:MSbCT7xGaklWYBJA@db.taorpudiapiscrwbmtww.supabase.co:5432/postgres"';
  
  // Find where to insert it (after other DATABASE_URL comments)
  let insertIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('DATABASE_URL')) {
      insertIndex = i + 1;
      break;
    }
  }
  
  if (insertIndex > -1) {
    lines.splice(insertIndex, 0, dbUrlLine);
    envContent = lines.join('\n');
  } else {
    envContent += '\n' + dbUrlLine + '\n';
  }
}

fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env to use direct connection:');
console.log('   db.taorpudiapiscrwbmtww.supabase.co:5432\n');
console.log('📝 Now try:');
console.log('   npm run db:test');
console.log('   npx prisma migrate dev --name add_ratings_reviews_sessions_location\n');





