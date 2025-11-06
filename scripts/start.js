const fs = require('fs/promises');
const path = require('path');
const { seedSamples } = require('./seed');

async function ensureSeed() {
  const root = process.env.DATA_ROOT || path.join(process.cwd(), 'data');
  const seedOnEmpty = (process.env.SEED_ON_EMPTY || 'true') === 'true';
  const overwrite = (process.env.SEED_OVERWRITE || 'false') === 'true';

  try {
    await fs.mkdir(root, { recursive: true });
    const files = await fs.readdir(root);

    if (!seedOnEmpty) {
      console.log('[seed] SEED_ON_EMPTY=false, skipping seed');
      return;
    }

    if (files.length === 0 || overwrite) {
      console.log(`[seed] ${overwrite ? 'Overwriting' : 'Populating'} sample data...`);
      await seedSamples(root);
      console.log('[seed] Sample data written to', root);
    } else {
      console.log('[seed] Data directory not empty, skipping seed');
    }
  } catch (error) {
    console.error('[seed] Failed:', error);
  }
}

async function start() {
  // Ensure data is seeded
  await ensureSeed();

  // Start Next.js server
  console.log('[start] Starting Next.js server...');

  // In production, we use standalone mode
  const standalone = path.join(process.cwd(), '.next', 'standalone', 'server.js');

  try {
    await fs.access(standalone);
    // Standalone server exists
    require(standalone);
  } catch {
    // Fallback to regular Next.js start
    const next = require('next');
    const app = next({ dev: false });
    const handle = app.getRequestHandler();
    const http = require('http');

    await app.prepare();

    const port = parseInt(process.env.PORT || '3000', 10);

    http.createServer((req, res) => {
      handle(req, res);
    }).listen(port, () => {
      console.log(`[start] Server listening on http://localhost:${port}`);
    });
  }
}

start().catch((error) => {
  console.error('[start] Failed to start:', error);
  process.exit(1);
});
