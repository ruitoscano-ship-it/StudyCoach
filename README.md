# StudyCoach

Application for teachers, students and parents to manage study roadmap.

## Environment

1. Copy `.env.example` to `.env`.
2. Set at least:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL` / `NEXTAUTH_URL`
3. Keep `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=false` outside demo environments.

## Runtime and database safety

- Local/dev can use `prisma db push` for speed.
- Production must use committed Prisma migrations and `prisma migrate deploy`.
- The container entrypoint now fails in production if `prisma/migrations` is missing.
