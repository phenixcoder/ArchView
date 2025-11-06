# Quick Start Guide

Get ArchView up and running in less than 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- OR Node.js 20+ and pnpm installed

## Option 1: Docker (Recommended)

### 1. Clone the repository

```bash
git clone https://github.com/phenixcoder/ArchView.git
cd ArchView
```

### 2. Start the application

```bash
docker-compose up -d
```

### 3. Access the application

Open your browser to [http://localhost:3000](http://localhost:3000)

The application will automatically:
- Seed sample data (if the `data/` directory is empty)
- Start the Next.js server
- Be ready to explore!

### 4. Stop the application

```bash
docker-compose down
```

## Option 2: Local Development

### 1. Clone the repository

```bash
git clone https://github.com/phenixcoder/ArchView.git
cd ArchView
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start the development server

```bash
pnpm dev
```

### 4. Access the application

Open your browser to [http://localhost:3000](http://localhost:3000)

Sample data is already included in the `data/` directory!

## Using the Application

### 1. Select a Journey

- Click on the **Journeys** tab in the left panel
- Browse journeys organized by category
- Click on a journey to visualize it (e.g., "🛒 Guest Checkout")

### 2. View System Details

- Click on any node in the graph to see details in the right panel
- View owners, documentation links, and health status

### 3. Filter by Layers

- Click on the **Layers** tab in the left panel
- Toggle connection groups (e.g., "api", "payments", "events")
- See how different layers interact

### 4. Switch Environments

- Use the environment buttons in the top-right (Dev/Stage/Prod)
- See health indicators update on nodes and connections

### 5. Browse Systems

- Click on the **Systems** tab in the left panel
- Search for systems by name, domain, or tags
- Click to view details

## Customizing Your Data

### 1. Edit System Definitions

Edit `data/systems.json`:

```json
{
  "systems": [
    {
      "id": "my-service",
      "name": "My Service",
      "domain": "my-service.example.com",
      "tags": ["backend"],
      "owners": [{"name": "My Team", "email": "team@example.com"}],
      "status": {"dev": "healthy", "stage": "healthy", "prod": "healthy"}
    }
  ]
}
```

### 2. Edit Connection Definitions

Edit `data/connections.json`:

```json
{
  "connections": [
    {
      "id": "c1",
      "from": "web",
      "to": "my-service",
      "label": "API Call",
      "protocol": "HTTPS",
      "tags": ["api"]
    }
  ]
}
```

### 3. Create a Journey

Create `data/journeys/my-category/my-journey.journey.json`:

```json
{
  "id": "my-category/my-journey",
  "name": "My Journey",
  "label": "🚀 My Journey",
  "connections": ["c1"],
  "tags": ["important"]
}
```

### 4. Restart to see changes

**Docker:**
```bash
docker-compose restart
```

**Local dev:**
Changes are automatically reloaded!

## Troubleshooting

### Port 3000 already in use

**Docker:**
Edit `docker-compose.yml` and change the port:
```yaml
ports:
  - "3001:3000"
```

**Local dev:**
```bash
PORT=3001 pnpm dev
```

### Data not loading

1. Check that the `data/` directory exists
2. Verify JSON files are valid (run `pnpm validate-data`)
3. Check container logs: `docker-compose logs`

### Docker build failing

Make sure you have enough disk space and memory:
```bash
docker system prune
```

## Next Steps

- Read the full [README.md](./README.md) for detailed feature documentation
- Check the [PRD.md](./PRD.md) for complete specifications
- See [DEPLOY.md](./DEPLOY.md) for production deployment options

## Support

Found an issue? Create an issue on [GitHub](https://github.com/phenixcoder/ArchView/issues)

Happy exploring! 🎉
