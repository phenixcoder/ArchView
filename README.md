# ArchView

A React/Next.js application that visualizes an organization's system architecture and user journeys.

## Features

- 📊 Interactive system architecture visualization
- 🗺️ Journey-based filtering and highlighting
- 🏷️ Connection layer filtering
- 🌍 Multi-environment health status (dev/stage/prod)
- 📝 Comprehensive metadata (owners, docs, credentials)
- 🎯 Left panel for navigation, right panel for details
- 💾 Git-friendly JSON data storage

## Quick Start

### Using Docker (Recommended)

```bash
# Build and run with docker-compose
docker-compose up -d

# Access the application
open http://localhost:3000
```

### Local Development

```bash
# Install dependencies
pnpm install

# Seed sample data (if needed)
pnpm seed

# Start development server
pnpm dev

# Access the application
open http://localhost:3000
```

## Documentation

- **[Product Requirements Document](./PRD.md)** - Detailed feature specifications
- **[Deployment Guide](./DEPLOY.md)** - Deployment instructions for various environments

## Data Structure

The application reads JSON files from the `data/` directory:

```
data/
  systems.json          # System definitions
  connections.json      # Connection definitions
  journeys/             # Journey definitions
    commerce/
      checkout/
        guest.journey.json
      payments/
        card-auth-capture.journey.json
    platform/
      events/
        order-placed.journey.json
```

### Example System

```json
{
  "id": "web",
  "name": "Web Frontend",
  "domain": "app.example.com",
  "tags": ["frontend"],
  "owners": [{ "name": "Frontend Team", "email": "frontend@example.com" }],
  "status": { "dev": "healthy", "stage": "healthy", "prod": "healthy" }
}
```

### Example Connection

```json
{
  "id": "c1",
  "from": "web",
  "to": "bff",
  "label": "HTTPS API Calls",
  "protocol": "HTTPS",
  "endpoint": "/api/v1",
  "tags": ["api"],
  "credentialAlias": "web-to-bff-api-key"
}
```

### Example Journey

```json
{
  "id": "commerce/checkout/guest",
  "name": "Guest Checkout",
  "label": "🛒 Guest Checkout",
  "connections": ["c1", "c2", "c3", "c4"],
  "tags": ["p0", "revenue"]
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_ROOT` | `./data` | Path to data directory |
| `SEED_ON_EMPTY` | `true` | Auto-populate sample data if empty |
| `SEED_OVERWRITE` | `false` | Overwrite existing data with samples |
| `PORT` | `3000` | Server port |

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm seed` - Seed sample data
- `pnpm validate-data` - Validate data files

## Architecture

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Validation:** Zod
- **Graph Layout:** Dagre (with grid fallback)
- **Deployment:** Docker

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests as needed
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please create an issue on GitHub.
