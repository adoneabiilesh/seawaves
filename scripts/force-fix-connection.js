// Force fix connection string - more robust version
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');
console.log('📄 Current .env content:');
console.log(envContent);
console.log('\n');

// Find all DATABASE_URL lines
const lines = envContent.split('\n');
let found = false;

const newLines = lines.map(line => {
  if (line.trim().startsWith('DATABASE_URL=') || line.trim().startsWith('DATABASE_URL =')) {
    found = true;
    
    // Extract the URL value
    let url = line.match(/["']?([^"'\n]+)["']?$/)?.[1] || 
              line.split('=')[1]?.trim().replace(/^["']|["']$/g, '');
    
    if (!url) {
      console.error('❌ Could not parse DATABASE_URL');
      return line;
    }
    
    console.log('🔍 Found DATABASE_URL:', url.replace(/:[^:@]+@/, ':****@'));
    
    // Convert pooler to direct
    if (url.includes('pooler.supabase.com')) {
      const newUrl = url
        .replace(/pooler\.supabase\.com:\d+/, 'supabase.co:5432')
        .replace(/aws-1-eu-west-1\.pooler\.supabase\.com:\d+/, 'aws-1-eu-west-1.supabase.co:5432');
      
      console.log('✅ Converting to:', newUrl.replace(/:[^:@]+@/, ':****@'));
      
      // Reconstruct the line
      if (line.includes('"')) {
        return `DATABASE_URL="${newUrl}"`;
      } else if (line.includes("'")) {
        return `DATABASE_URL='${newUrl}'`;
      } else {
        return `DATABASE_URL="${newUrl}"`;
      }
    } else if (url.includes('supabase.co:5432') && !url.includes('pooler')) {
      console.log('✅ Already using direct connection');
      return line;
    }
  }
  return line;
});

if (!found) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

// Backup
const backupPath = envPath + '.backup';
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, envContent);
  console.log('\n✅ Backup created: .env.backup');
}

// Write updated content
const updatedContent = newLines.join('\n');
fs.writeFileSync(envPath, updatedContent);

console.log('\n✅ .env file updated!');
console.log('\n📝 Updated content:');
console.log(updatedContent);
console.log('\n🧪 Testing connection...\n');





