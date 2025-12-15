// Database client using postgres (raw SQL)
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create connection with proper settings for Supabase
export const sql = postgres(process.env.DATABASE_URL, {
  max: 10, // Maximum number of connections
  idle_timeout: 20,
  connect_timeout: 10,
});

// Helper function to safely close connections
export async function closeDb() {
  await sql.end();
}





