# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build tools)
ENV NODE_ENV=development
RUN npm ci

# Copy source code
COPY . .

# Create data directory for SQLite (needed during build for SvelteKit prerendering)
RUN mkdir -p /app/data

# Set DATABASE_URL for build process
ENV DATABASE_URL=/app/data/sqlite.db

# Generate database migrations and build
RUN npm run db:generate
RUN npm run db:push
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create data directory for SQLite
RUN mkdir -p /app/data

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/lib/server/db/schema.ts ./src/lib/server/db/schema.ts

# Copy startup script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=/app/data/sqlite.db
ENV ORIGIN=http://localhost:3000

# Expose port
EXPOSE 3000

# Health check - use 127.0.0.1 to force IPv4 (wget tries IPv6 first with localhost)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1

# Start the application using entrypoint script
CMD ["/app/docker-entrypoint.sh"]
