# Fix: "prepared statement already exists" Error

## Problem
This error occurs because Supabase's connection pooler reuses connections, causing conflicts with Prisma migrations.

## Solution: Use Direct Connection for Migrations

### Option 1: Update .env for Migrations (Recommended)

Your current connection string uses the pooler. For migrations, you need a **direct connection**.

**Current (Pooler - for app):**
```
postgresql://postgres.xxx:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**For Migrations (Direct):**
```
postgresql://postgres.xxx:password@aws-1-eu-west-1.supabase.co:5432/postgres?sslmode=require
```

**Changes:**
- `pooler.supabase.com` → `supabase.co`
- Port `6543` → `5432`
- Remove `pooler` from hostname

### Option 2: Add Connection Parameter

Add `?pgbouncer=true` parameter to disable prepared statements:

```env
DATABASE_URL="postgresql://postgres.xxx:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
```

### Option 3: Use Two Connection Strings

Create two connection strings in `.env`:

```env
# For app runtime (pooler)
DATABASE_URL="postgresql://postgres.xxx:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"

# For migrations (direct)
DIRECT_URL="postgresql://postgres.xxx:password@aws-1-eu-west-1.supabase.co:5432/postgres?sslmode=require"
```

Then run migrations with:
```bash
DATABASE_URL=$DIRECT_URL npx prisma migrate dev
```

## Quick Fix: Get Direct Connection from Supabase

1. Go to Supabase Dashboard
2. Settings → Database
3. **Connection string** section
4. Look for **Direct connection** (not Connection pooling)
5. Copy that URL
6. Update your `.env` file

The direct connection should look like:
```
postgresql://postgres.xxx:password@aws-1-eu-west-1.supabase.co:5432/postgres
```

Notice: `supabase.co` (not `pooler.supabase.com`) and port `5432` (not `6543`)

## After Fixing

1. Update `.env` with direct connection
2. Run migration:
   ```bash
   npx prisma migrate dev --name add_ratings_reviews_sessions_location
   ```





