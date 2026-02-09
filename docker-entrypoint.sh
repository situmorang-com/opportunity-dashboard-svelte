#!/bin/sh
set -e

# Create data directory if it doesn't exist
mkdir -p /app/data

# Initialize database if it doesn't exist
if [ ! -f /app/data/sqlite.db ]; then
    echo "Initializing database..."
    # Create empty database file
    touch /app/data/sqlite.db
    # Run migrations using drizzle-kit
    npx drizzle-kit push --config=drizzle.config.ts
    echo "Database initialized."
fi

# Start the application
exec node build
