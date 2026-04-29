#!/bin/sh
set -e
echo "Applying database schema (prisma db push)..."
npx prisma db push
exec npm run start
