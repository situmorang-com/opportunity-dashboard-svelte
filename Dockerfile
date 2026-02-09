# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate database migrations and build
RUN npm run db:generate
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

# Copy seed script
COPY --from=builder /app/src/lib/server/db/seed.ts ./src/lib/server/db/seed.ts

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/sqlite.db
ENV ORIGIN=http://localhost:3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the application
CMD ["node", "build"]
