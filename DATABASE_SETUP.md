# Database Setup Guide

## Issue: Can't reach database server

The error indicates that Prisma cannot connect to your database. Here are the steps to fix it:

## Option 1: Use Supabase (Cloud Database)

If you're using Supabase:

1. **Get your connection string from Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → Database
   - Copy the "Connection string" (URI format)
   - It should look like: `postgresql://postgres:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`

2. **Create a `.env` file in the root directory:**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
   ```
   Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

3. **For migrations, use the direct connection (not pooler):**
   ```env
   # For migrations (direct connection)
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
   ```
   Note: Port 6543 is for direct connections, 5432 is for pooled connections.

## Option 2: Use Local PostgreSQL

If you prefer a local database:

1. **Install PostgreSQL:**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create a database:**
   ```bash
   createdb culinaryai
   ```

3. **Create `.env` file:**
   ```env
   DATABASE_URL="postgresql://postgres:your-local-password@localhost:5432/culinaryai?schema=public"
   ```

## Option 3: Use SQLite for Development (Easier)

For quick development without setting up PostgreSQL:

1. **Update `prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. **No `.env` file needed for SQLite**

3. **Run migration:**
   ```bash
   npx prisma migrate dev --name add_ratings_reviews_sessions_location
   ```

## Running Migrations

Once your `.env` file is set up:

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Run migrations:**
   ```bash
   npx prisma migrate dev --name add_ratings_reviews_sessions_location
   ```

3. **Verify connection:**
   ```bash
   npx prisma db pull
   ```

## Troubleshooting

### Error: Can't reach database server

**Possible causes:**
- Database server is not running (for local)
- Wrong connection string
- Firewall blocking connection
- Database credentials are incorrect
- Network connectivity issues

**Solutions:**
1. Verify your connection string is correct
2. Check if your database server is running (for local)
3. Verify your Supabase project is active
4. Check firewall settings
5. Try using the direct connection port (6543) instead of pooler (5432)

### For Supabase specifically:

- Make sure your project is not paused
- Check that you're using the correct password
- Try the direct connection URL instead of the pooler URL
- Ensure your IP is whitelisted (if IP restrictions are enabled)

## Quick Start (SQLite - Recommended for Development)

If you just want to get started quickly:

1. Update `prisma/schema.prisma` datasource to use SQLite
2. Run: `npx prisma migrate dev`
3. No `.env` file needed!

Note: SQLite has limitations and is not recommended for production. Use PostgreSQL for production.





