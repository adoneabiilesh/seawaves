# Get Direct Connection String from Supabase

## The Issue
Prisma migrations need a **direct connection**, not the pooler. The error "prepared statement already exists" happens because poolers reuse connections.

## Get the Correct Direct Connection

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Select your project

### Step 2: Get Direct Connection String
1. Go to **Settings** → **Database**
2. Scroll to **Connection string** section
3. Look for **"Direct connection"** (NOT "Connection pooling")
4. Select **URI** format
5. Copy the connection string

### Step 3: Update .env
Replace your `DATABASE_URL` with the direct connection string.

**Direct connection format:**
```
postgresql://postgres.REF:PASSWORD@aws-REGION.supabase.co:5432/postgres?sslmode=require
```

**Key differences:**
- `supabase.co` (NOT `pooler.supabase.com`)
- Port `5432` (NOT `6543`)
- No `pooler` in the hostname

## Quick Fix

The script should have already fixed it, but if you're still getting errors:

1. **Get direct connection from Supabase dashboard** (see above)
2. **Update .env manually:**
   ```env
   DATABASE_URL="postgresql://postgres.taorpudiapiscrwbmtww:YOUR_PASSWORD@aws-1-eu-west-1.supabase.co:5432/postgres?sslmode=require"
   ```
3. **Run migration:**
   ```bash
   npx prisma migrate dev --name add_ratings_reviews_sessions_location
   ```

## Verify Connection

Test if it's working:
```bash
npm run db:test
```

If it shows `supabase.co:5432` (not `pooler.supabase.com`), you're good!





