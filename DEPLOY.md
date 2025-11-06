# Deployment Guide

## Overview

ArchView is a Next.js application that can be deployed using Docker or traditional Node.js hosting. This guide covers both deployment methods.

## Prerequisites

- Docker (for containerized deployment)
- Node.js 20+ and pnpm (for local development)
- code-mini/lets-deploy CLI (for simplified deployment)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_ROOT` | `/app/data` | Path to the data directory containing JSON files |
| `SEED_ON_EMPTY` | `true` | Auto-populate sample data if data directory is empty |
| `SEED_OVERWRITE` | `false` | Overwrite existing data with samples (use with caution) |
| `AUTH_TOKEN` | - | Optional: Enable basic auth middleware for non-public deployments |
| `PORT` | `3000` | Port on which the application runs |
| `NODE_ENV` | `production` | Node environment |

## Quick Start with code-mini/lets-deploy

```bash
# Install lets-deploy if not already installed
npm install -g @code-mini/lets-deploy

# Deploy from repository root
lets-deploy
```

The deployment will:
1. Build the Docker image
2. Push to container registry
3. Deploy to your configured environment
4. Mount persistent volume for data directory

## Docker Deployment

### Building the Image

```bash
docker build -t archview:latest .
```

### Running the Container

**With empty data (auto-seed):**

```bash
docker run -d \
  --name archview \
  -p 3000:3000 \
  -e DATA_ROOT=/app/data \
  -e SEED_ON_EMPTY=true \
  -v $(pwd)/data:/app/data \
  archview:latest
```

**With existing data:**

```bash
docker run -d \
  --name archview \
  -p 3000:3000 \
  -e DATA_ROOT=/app/data \
  -e SEED_ON_EMPTY=false \
  -v /path/to/your/data:/app/data \
  archview:latest
```

**With authentication:**

```bash
docker run -d \
  --name archview \
  -p 3000:3000 \
  -e AUTH_TOKEN=your-secret-token \
  -e DATA_ROOT=/app/data \
  -v $(pwd)/data:/app/data \
  archview:latest
```

### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  archview:
    image: archview:latest
    build: .
    ports:
      - "3000:3000"
    environment:
      DATA_ROOT: /app/data
      SEED_ON_EMPTY: "true"
      NODE_ENV: production
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

## Manual Deployment (Node.js)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build the Application

```bash
pnpm build
```

### 3. Start the Server

```bash
pnpm start
```

Or with custom environment:

```bash
DATA_ROOT=/custom/path/to/data PORT=8080 pnpm start
```

## Data Management

### Data Directory Structure

```
data/
  systems.json
  connections.json
  journeys/
    commerce/
      checkout/
        guest.journey.json
      payments/
        card-auth-capture.journey.json
    platform/
      events/
        order-placed.journey.json
```

### Mounting Custom Data

1. **Prepare your data directory** following the structure above
2. **Mount it to the container** at `/app/data` (or your configured `DATA_ROOT`)
3. **Set `SEED_ON_EMPTY=false`** to prevent auto-seeding

### Updating Data

Data changes can be made by:
1. Editing JSON files in the mounted volume
2. Restarting the container (hot reload in dev mode)
3. Using git to manage data files and deploying updates

## Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure persistent volume for `/app/data`
- [ ] Set `SEED_ON_EMPTY=false` if using real data
- [ ] Configure `AUTH_TOKEN` if authentication is needed
- [ ] Set up reverse proxy (nginx/caddy) with HTTPS
- [ ] Configure CORS if needed
- [ ] Set up monitoring and logging
- [ ] Configure backup for data directory
- [ ] Test with your actual data before go-live

## Kubernetes Deployment (Optional)

Example deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: archview
spec:
  replicas: 2
  selector:
    matchLabels:
      app: archview
  template:
    metadata:
      labels:
        app: archview
    spec:
      containers:
      - name: archview
        image: archview:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATA_ROOT
          value: /app/data
        - name: SEED_ON_EMPTY
          value: "false"
        volumeMounts:
        - name: data
          mountPath: /app/data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: archview-data
---
apiVersion: v1
kind: Service
metadata:
  name: archview
spec:
  selector:
    app: archview
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Health Checks

- **Endpoint:** `GET /api/health` (to be implemented)
- **Expected Response:** `200 OK`

## Troubleshooting

### Container won't start

Check logs:
```bash
docker logs archview
```

### Data not loading

1. Verify volume mount: `docker inspect archview`
2. Check file permissions in mounted directory
3. Verify JSON file syntax with `pnpm validate-data`

### Out of memory

Increase container memory limit:
```bash
docker run -m 2g archview:latest
```

## Performance Tuning

For large graphs (>500 nodes):
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Consider using a CDN for static assets
- Enable compression in reverse proxy

## Support

For issues and questions:
- GitHub Issues: https://github.com/phenixcoder/ArchView/issues
- Documentation: See PRD.md for detailed specifications
