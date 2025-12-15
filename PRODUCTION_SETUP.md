# Production Database Setup Guide

## Recommended: PostgreSQL (Supabase) for Production

### Why PostgreSQL for Production?

✅ **Concurrent Access**: Multiple users can read/write simultaneously  
✅ **Scalability**: Handles thousands of concurrent connections  
✅ **Performance**: Optimized for production workloads  
✅ **Reliability**: Better crash recovery and data integrity  
✅ **Security**: Advanced security features (row-level security, encryption)  
✅ **Features**: Full-text search, JSON queries, complex joins  

### SQLite Limitations in Production

❌ Single writer at a time (bottleneck)  
❌ File-based (not suitable for high traffic)  
❌ Limited concurrency  
❌ No network access  
❌ File locking issues with multiple processes  

## Setting Up PostgreSQL for Production

### Option 1: Supabase (Recommended - Free Tier Available)

1. **Get Your Connection String:**
   - Go to Supabase Dashboard → Your Project
   - Settings → Database
   - Connection string → URI
   - Copy the connection string

2. **Use Direct Connection for Migrations:**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
   ```
   - Port `6543` = Direct connection (for migrations)
   - Port `5432` = Pooled connection (for app runtime)

3. **Important: URL Encode Your Password**
   If your password has special characters, encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `&` → `%26`
   - `+` → `%2B`
   - `=` → `%3D`

### Option 2: Other PostgreSQL Providers

- **Railway**: Easy setup, good free tier
- **Neon**: Serverless PostgreSQL, great for Next.js
- **AWS RDS**: Enterprise-grade, scalable
- **DigitalOcean**: Managed PostgreSQL
- **Heroku Postgres**: Simple, reliable

## Fixing Connection Issues

### Common Problems & Solutions

1. **Connection Hangs/Timeouts**
   ```env
   # Add connection timeout
   DATABASE_URL="postgresql://...?connect_timeout=10"
   ```

2. **Wrong Port**
   - Try `6543` (direct) instead of `5432` (pooler)
   - Or vice versa

3. **Password Encoding**
   - Use URL encoding for special characters
   - Or change password to alphanumeric only

4. **Network/Firewall**
   - Check if Supabase project is active (not paused)
   - Verify IP whitelist settings
   - Try different network

5. **Connection Pooling**
   ```env
   # For app runtime (not migrations)
   DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
   ```

## Development vs Production Strategy

### Recommended Approach:

**Development:**
- Use SQLite (fast, no setup needed)
- File: `prisma/dev.db`
- No `.env` needed

**Production:**
- Use PostgreSQL (Supabase)
- Proper connection string in `.env`
- Environment-specific configs

### Environment-Specific Setup

Create different configs:

**`.env.local` (Development - SQLite):**
```env
# Not needed for SQLite
```

**`.env.production` (Production - PostgreSQL):**
```env
DATABASE_URL="postgresql://postgres:password@host:6543/postgres"
```

**`prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"  // or "sqlite" for dev
  url      = env("DATABASE_URL")
}
```

## Best Practices

1. **Never commit `.env` files** (already in `.gitignore`)
2. **Use different databases** for dev/staging/production
3. **Test migrations** on staging before production
4. **Backup regularly** (Supabase does this automatically)
5. **Monitor connection pool** usage
6. **Use connection pooling** for production apps

## Migration Strategy

1. **Develop locally** with SQLite
2. **Test migrations** on staging PostgreSQL
3. **Deploy to production** PostgreSQL
4. **Always backup** before migrations

## Quick Connection Test

Test your PostgreSQL connection:

```bash
# Test with psql (if installed)
psql "postgresql://postgres:password@host:6543/postgres"

# Or test with Prisma
npx prisma db pull --print
```

If it hangs, check:
- Connection string format
- Password encoding
- Network/firewall
- Database server status





