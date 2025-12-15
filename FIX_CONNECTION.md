# Fix PostgreSQL/Supabase Connection

## Quick Fix Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get Your Supabase Connection String

1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string**
5. Select **URI** format
6. Copy the connection string

**Important:** For migrations, use the **Direct connection** (port 6543), not the pooler (port 5432).

### Step 3: Setup Database Connection

**Option A: Use the setup wizard (Recommended)**
```bash
npm run db:setup
```

This will guide you through creating the `.env` file with proper password encoding.

**Option B: Manual Setup**

1. Create/Edit `.env` file in the root directory
2. Add your connection string:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
```

**Important:** If your password has special characters, URL encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Example:**
If password is `my@pass#123`, use: `my%40pass%23123`

### Step 4: Test Connection

```bash
npm run db:test
```

This will test your connection and show any errors.

### Step 5: Run Migrations

Once connection is working:
```bash
npx prisma generate
npx prisma migrate dev --name add_ratings_reviews_sessions_location
```

## Common Issues & Solutions

### Issue 1: Connection Hangs/Timeouts

**Solution:**
- Try port `6543` (direct connection) instead of `5432` (pooler)
- Check if Supabase project is active (not paused)
- Verify firewall isn't blocking port 5432/6543
- Try from different network (mobile hotspot)

### Issue 2: Authentication Failed

**Solution:**
- Verify password is correct
- URL encode special characters in password
- Check username (usually `postgres`)

### Issue 3: Can't Reach Database Server

**Solution:**
- Check Supabase project status
- Verify connection string format
- Check network connectivity
- Try direct connection URL from Supabase dashboard

### Issue 4: Wrong Connection String Format

**Correct Format:**
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

**Example:**
```
postgresql://postgres:mypassword@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

## Alternative: Get Connection String from Supabase

1. Go to Supabase Dashboard
2. Your Project → Settings → Database
3. **Connection string** section
4. Copy **Direct connection** (for migrations)
5. Format: `postgresql://postgres.[ref]:[password]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres`

## Quick Test Commands

```bash
# Test connection
npm run db:test

# Setup database (interactive)
npm run db:setup

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

## Still Having Issues?

1. **Check Supabase Dashboard:**
   - Is project active? (green status)
   - Settings → Database → Connection string

2. **Try Different Port:**
   - Port 6543 = Direct connection (for migrations)
   - Port 5432 = Pooled connection (for app)

3. **Test with psql** (if installed):
   ```bash
   psql "postgresql://postgres:password@host:6543/postgres"
   ```

4. **Check .env file:**
   - Make sure it's in root directory
   - No extra spaces or quotes issues
   - Password is URL encoded if needed

5. **Network Issues:**
   - Try different network
   - Check firewall settings
   - Verify IP whitelist in Supabase (if enabled)





