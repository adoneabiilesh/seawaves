# How to Switch Back to PostgreSQL

If you want to use PostgreSQL/Supabase later, just change the datasource in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

And make sure your `.env` file has:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
```

Then run:
```bash
npx prisma migrate dev
```





