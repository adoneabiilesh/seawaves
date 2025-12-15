#!/bin/bash
# Migration script that uses direct connection

# Use direct connection for migrations (not pooler)
export DATABASE_URL="${DATABASE_URL//pooler.supabase.com:6543/supabase.com:5432}"
export DATABASE_URL="${DATABASE_URL//?sslmode=require/}"

npx prisma migrate dev "$@"





