# Quick Fix for PostgreSQL Connection

## Step-by-Step Fix

### 1. Check Your `.env` File Format

Your `.env` should look like this:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
```

### 2. Common Issues & Fixes

#### Issue: Password has special characters
**Fix:** URL encode them:
- `@` → `%40`
- `#` → `%23`  
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Example:**
If password is `my@pass#123`, use: `my%40pass%23123`

#### Issue: Wrong port
**Try both:**
- Port `6543` (direct connection - for migrations)
- Port `5432` (pooled connection - for app)

#### Issue: Connection string format
**Correct format:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### 3. Test Your Connection

**Option A: Use the test script**
```bash
node test-connection.js
```

**Option B: Test with Prisma**
```bash
npx prisma db pull --print
```

**Option C: Test with psql** (if installed)
```bash
psql "postgresql://postgres:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
```

### 4. If Still Hanging

1. **Check Supabase Dashboard:**
   - Is project active? (not paused)
   - Settings → Database → Connection string

2. **Try Direct Connection URL:**
   Get it from Supabase Dashboard → Settings → Database → Connection string → Direct connection

3. **Check Firewall:**
   - Windows Firewall might be blocking
   - Try disabling temporarily to test

4. **Network Issues:**
   - Try from different network (mobile hotspot)
   - Check if corporate firewall is blocking

### 5. Alternative: Use Neon (Easier Setup)

If Supabase keeps having issues, try **Neon** (serverless PostgreSQL):

1. Sign up at https://neon.tech
2. Create a project
3. Copy connection string
4. Use in `.env`

Neon often has better connection reliability.

## Recommended Setup

**For Now (Development):**
- Keep SQLite (it's working)
- Fast development, no connection issues

**For Production:**
- Switch to PostgreSQL when ready
- Use Supabase or Neon
- Test connection thoroughly before deploying

## Switch Schema Back to PostgreSQL

When ready to use PostgreSQL, change `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then ensure your `.env` has the correct connection string.





