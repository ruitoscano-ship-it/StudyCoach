#!/bin/sh
set -e

if [ "$NODE_ENV" = "production" ]; then
  if [ ! -d "prisma/migrations" ]; then
    echo "ERROR: prisma/migrations directory not found."
    echo "Create and commit Prisma migrations before running in production."
    exit 1
  fi
  echo "Applying database migrations (prisma migrate deploy)..."
  npx prisma migrate deploy
else
  echo "Non-production mode: applying schema with prisma db push..."
  npx prisma db push
fi

exec npm run start
