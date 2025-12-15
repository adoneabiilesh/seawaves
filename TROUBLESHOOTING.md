# Prisma Connection Troubleshooting

## Issue: Prisma commands hang/take too long

This usually means Prisma can't connect to your database. Here are solutions:

## Quick Fix: Use SQLite for Development

The fastest way to get started is to use SQLite locally:

1. **Update `prisma/schema.prisma`:**
   Change the datasource to:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. **No `.env` file needed for SQLite!**

3. **Run migration:**
   ```bash
   npx prisma migrate dev --name add_ratings_reviews_sessions_location
   ```

## If Using Supabase/PostgreSQL

### Check Your Connection String Format

Your `.env` file should have:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
```

**Common Issues:**

1. **Wrong Port:**
   - Use `6543` for direct connections (migrations)
   - Use `5432` for pooled connections (app runtime)
   - Try both if one doesn't work

2. **Password with Special Characters:**
   - URL encode special characters in password
   - Example: `@` becomes `%40`, `#` becomes `%23`

3. **Connection Pooling:**
   - For migrations, use direct connection (port 6543)
   - Add `?pgbouncer=true&connection_limit=1` for pooler

### Test Connection Manually

Try connecting with `psql` or a database client to verify:
```bash
psql "postgresql://postgres:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
```

### Alternative Connection String Formats

**Direct Connection (for migrations):**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
```

**Pooled Connection (for app):**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
```

**With Schema:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?schema=public"
```

## Network/Firewall Issues

1. **Check if Supabase project is active** (not paused)
2. **Verify your IP is whitelisted** in Supabase settings
3. **Check firewall** isn't blocking port 5432/6543
4. **Try from different network** (mobile hotspot) to test

## Timeout Solutions

Add connection timeout to your connection string:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?connect_timeout=10"
```

## Recommended: Use SQLite for Development

For local development, SQLite is much faster and easier:
- No network latency
- No connection issues
- Works offline
- Perfect for development

You can always switch back to PostgreSQL for production.





