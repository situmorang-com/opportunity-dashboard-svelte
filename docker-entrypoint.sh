#!/bin/sh
set -e

# Create data directory if it doesn't exist
mkdir -p /app/data

# Create database file if it doesn't exist
if [ ! -f /app/data/sqlite.db ]; then
    echo "Creating new database..."
    touch /app/data/sqlite.db
fi

# Always apply migrations on startup (idempotent - safe to run every time)
echo "Applying database migrations..."
npx drizzle-kit push --config=drizzle.config.ts
echo "Migrations complete."

# Ensure default data exists (idempotent) without TS runtime
node /app/scripts/seed-prod.js

# Start the application
exec node build
