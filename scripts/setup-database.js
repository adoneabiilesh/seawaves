// Setup script to help configure database
// Run: node scripts/setup-database.js

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function urlEncodePassword(password) {
  return password
    .replace(/%/g, '%25')
    .replace(/@/g, '%40')
    .replace(/#/g, '%23')
    .replace(/\$/g, '%24')
    .replace(/&/g, '%26')
    .replace(/\+/g, '%2B')
    .replace(/=/g, '%3D');
}

async function setup() {
  console.log('🚀 Database Setup Wizard\n');
  console.log('This will help you create a .env file with the correct DATABASE_URL\n');
  
  const host = await question('Database host (e.g., aws-1-eu-west-1.pooler.supabase.com): ');
  const port = await question('Port (6543 for direct, 5432 for pooler) [6543]: ') || '6543';
  const database = await question('Database name [postgres]: ') || 'postgres';
  const user = await question('Username [postgres]: ') || 'postgres';
  const password = await question('Password: ');
  
  const encodedPassword = urlEncodePassword(password);
  
  const connectionString = `postgresql://${user}:${encodedPassword}@${host}:${port}/${database}`;
  
  console.log('\n📝 Generated connection string:');
  console.log(`postgresql://${user}:****@${host}:${port}/${database}\n`);
  
  // Read existing .env or create new
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if DATABASE_URL already exists
    if (envContent.includes('DATABASE_URL=')) {
      const overwrite = await question('DATABASE_URL already exists. Overwrite? (y/n) [n]: ') || 'n';
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Cancelled.');
        rl.close();
        return;
      }
      
      // Replace existing DATABASE_URL
      envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${connectionString}"`);
    } else {
      envContent += `\nDATABASE_URL="${connectionString}"\n`;
    }
  } else {
    envContent = `DATABASE_URL="${connectionString}"\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file updated!\n');
  
  console.log('🧪 Testing connection...\n');
  rl.close();
  
  // Run connection test
  require('./test-db-connection.js');
}

setup().catch(console.error);





