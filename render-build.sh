#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit
set -o pipefail

echo "📦 Ensure pnpm available..."
if ! command -v pnpm >/dev/null 2>&1; then
	echo "pnpm not found — enabling corepack to provide pnpm"
	corepack enable
fi

export NODE_ENV=production

echo "📦 Installing dependencies (using pnpm)..."
pnpm install --frozen-lockfile

echo "🔧 Generating Prisma Client..."
pnpm prisma generate || npx prisma generate

if [ -n "${DATABASE_URL:-}" ]; then
	echo "🗄️ Running database sync (DATABASE_URL detected)..."
	pnpm prisma db push --accept-data-loss || npx prisma db push --accept-data-loss
else
	echo "⚠️ DATABASE_URL not set — skipping prisma migrations"
fi

echo "🏗️ Building project..."
pnpm run build

echo "✅ Build completed successfully!"