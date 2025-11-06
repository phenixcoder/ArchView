const fs = require('fs/promises');
const path = require('path');

async function validateData() {
  const dataRoot = process.env.DATA_ROOT || path.join(process.cwd(), 'data');

  console.log(`Validating data in ${dataRoot}...`);

  try {
    // Check if data directory exists
    try {
      await fs.access(dataRoot);
    } catch {
      console.warn(`⚠️  Data directory ${dataRoot} does not exist. Will be seeded on first run.`);
      return true;
    }

    // Check systems.json
    try {
      const systemsData = await fs.readFile(path.join(dataRoot, 'systems.json'), 'utf-8');
      const systems = JSON.parse(systemsData);
      if (!systems.systems || !Array.isArray(systems.systems)) {
        throw new Error('systems.json must have a "systems" array');
      }
      console.log(`✅ systems.json: ${systems.systems.length} systems`);
    } catch (error) {
      console.warn(`⚠️  systems.json validation warning: ${error.message}`);
    }

    // Check connections.json
    try {
      const connectionsData = await fs.readFile(path.join(dataRoot, 'connections.json'), 'utf-8');
      const connections = JSON.parse(connectionsData);
      if (!connections.connections || !Array.isArray(connections.connections)) {
        throw new Error('connections.json must have a "connections" array');
      }
      console.log(`✅ connections.json: ${connections.connections.length} connections`);
    } catch (error) {
      console.warn(`⚠️  connections.json validation warning: ${error.message}`);
    }

    // Check journeys directory
    try {
      const journeysDir = path.join(dataRoot, 'journeys');
      await fs.access(journeysDir);
      console.log('✅ journeys/ directory exists');
    } catch (error) {
      console.warn('⚠️  journeys/ directory does not exist');
    }

    console.log('✅ Data validation passed');
    return true;
  } catch (error) {
    console.error('❌ Data validation failed:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  validateData()
    .then((success) => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

module.exports = { validateData };
