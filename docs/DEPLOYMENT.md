# Deployment Guide

This document covers deploying the Sales Opportunity Dashboard to production environments.

## Overview

The application is built with SvelteKit using the **Node.js adapter**, which produces a standalone Node.js server. Deployment options include:

- **Docker** (recommended)
- **Node.js directly**
- **Cloud platforms** (Vercel, Railway, Fly.io)

## Prerequisites

- Node.js 20+ (for local builds)
- Docker (for containerized deployment)
- Google OAuth credentials configured for production domain

## Build Process

### Local Build

```bash
# Install dependencies
npm ci

# Build for production
npm run build
```

This creates the `build/` directory containing the production server.

### Build Output

```
build/
├── client/          # Static assets
├── server/          # Server-side code
├── prerendered/     # Pre-rendered pages
└── index.js         # Server entry point
```

---

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Create `.env` file**:

```env
ORIGIN=https://yourdomain.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

2. **Start the application**:

```bash
docker-compose up -d
```

3. **View logs**:

```bash
docker-compose logs -f
```

4. **Stop the application**:

```bash
docker-compose down
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/sqlite.db
      - ORIGIN=${ORIGIN:-http://localhost:3000}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    volumes:
      - sqlite_data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 3s
      start_period: 10s
      retries: 3

volumes:
  sqlite_data:
    driver: local
```

### Building Docker Image Manually

```bash
# Build the image
docker build -t sales-dashboard .

# Run the container
docker run -d \
  --name sales-dashboard \
  -p 3000:3000 \
  -e ORIGIN=https://yourdomain.com \
  -e GOOGLE_CLIENT_ID=your-client-id \
  -e GOOGLE_CLIENT_SECRET=your-client-secret \
  -v sales_data:/app/data \
  sales-dashboard
```

### Dockerfile

```dockerfile
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
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ORIGIN` | Public URL of the application | `https://sales.company.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-xxx` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `file:./data/sqlite.db` | SQLite database path |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |

### Setting Environment Variables

**Docker Compose**:
```yaml
environment:
  - ORIGIN=https://yourdomain.com
```

**Docker run**:
```bash
docker run -e ORIGIN=https://yourdomain.com ...
```

**Systemd service**:
```ini
[Service]
Environment="ORIGIN=https://yourdomain.com"
```

---

## Database Setup

### Initial Setup

The database is automatically created on first run. To seed initial data:

```bash
# Inside container
docker exec -it sales-dashboard npx tsx src/lib/server/db/seed.ts

# Or locally
npm run db:seed
```

### Database Persistence

**Docker volumes** ensure data persists across container restarts:

```yaml
volumes:
  - sqlite_data:/app/data  # Named volume

# Or bind mount to host
volumes:
  - ./data:/app/data  # Host directory
```

### Backups

```bash
# Copy database from container
docker cp sales-dashboard:/app/data/sqlite.db ./backup-$(date +%Y%m%d).db

# Or for bind mounts, backup directly
cp ./data/sqlite.db ./backup-$(date +%Y%m%d).db
```

### Restore

```bash
# Stop container
docker-compose down

# Replace database
docker cp ./backup.db sales-dashboard:/app/data/sqlite.db

# Start container
docker-compose up -d
```

---

## Google OAuth Configuration

### Production Redirect URIs

In [Google Cloud Console](https://console.cloud.google.com/):

1. Go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add production redirect URI:
   ```
   https://yourdomain.com/login/google/callback
   ```

### OAuth Consent Screen

For external users:
1. Verify domain ownership
2. Submit for Google review (required for > 100 users)

For internal (Google Workspace):
1. Select "Internal" user type
2. No verification needed

---

## Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 80;
    server_name sales.company.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sales.company.com;

    ssl_certificate /etc/letsencrypt/live/sales.company.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sales.company.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Traefik (Docker)

```yaml
services:
  app:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.sales.rule=Host(`sales.company.com`)"
      - "traefik.http.routers.sales.tls.certresolver=letsencrypt"
```

---

## Cloud Deployment

### Fly.io

1. **Install Fly CLI**:
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Create `fly.toml`**:
```toml
app = "sales-dashboard"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true

[[mounts]]
  source = "sales_data"
  destination = "/app/data"
```

3. **Deploy**:
```bash
fly launch
fly secrets set GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=xxx ORIGIN=https://sales-dashboard.fly.dev
fly deploy
```

### Railway

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

### Vercel

> Note: SQLite persistence requires external database or edge config.

Consider using Turso (SQLite edge) for Vercel deployments.

---

## Production Checklist

### Before Deployment

- [ ] Set `ORIGIN` to production URL
- [ ] Configure Google OAuth redirect URIs
- [ ] Generate strong session secrets
- [ ] Set up database backups
- [ ] Configure monitoring/alerting

### Security

- [ ] HTTPS enabled (TLS certificate)
- [ ] Secure cookie settings (`secure: true`)
- [ ] Rate limiting configured
- [ ] CORS configured correctly
- [ ] Environment variables secured

### Monitoring

- [ ] Health check endpoint working
- [ ] Log aggregation configured
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Uptime monitoring

### Database

- [ ] Backup schedule configured
- [ ] Database volume persistent
- [ ] Migration process tested

---

## Troubleshooting

### Container Won't Start

**Check logs**:
```bash
docker-compose logs app
```

**Common issues**:
- Missing environment variables
- Port already in use
- Volume permissions

### OAuth Callback Fails

**Check**:
1. `ORIGIN` matches actual URL (including protocol)
2. Redirect URI registered in Google Console
3. HTTPS configured correctly

### Database Errors

**Reset database** (development only):
```bash
docker-compose down -v  # Removes volumes
docker-compose up -d
docker exec -it app npm run db:seed
```

### Health Check Fails

**Debug**:
```bash
docker exec -it sales-dashboard wget -O- http://localhost:3000
```

---

## Scaling

### Horizontal Scaling

SQLite is single-node. For horizontal scaling:

1. **Option A**: Switch to PostgreSQL
2. **Option B**: Use Turso (distributed SQLite)
3. **Option C**: Run single instance behind load balancer (session sticky)

### Vertical Scaling

Increase container resources:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

---

## Maintenance

### Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Zero-Downtime Updates

```bash
# Build new image
docker-compose build

# Scale up new container
docker-compose up -d --scale app=2 --no-recreate

# Wait for new container to be healthy
# Then remove old container
docker-compose up -d --scale app=1
```
