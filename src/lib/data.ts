import fs from 'fs/promises';
import path from 'path';
import {
  System,
  Connection,
  Journey,
  SystemsCollectionSchema,
  ConnectionsCollectionSchema,
  JourneySchema,
} from './schema';

const DATA_ROOT = process.env.DATA_ROOT || path.join(process.cwd(), 'data');

/**
 * Load systems from systems.json
 */
export async function loadSystems(): Promise<System[]> {
  try {
    const filePath = path.join(DATA_ROOT, 'systems.json');
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    const validated = SystemsCollectionSchema.parse(data);
    return validated.systems;
  } catch (error) {
    console.error('Failed to load systems:', error);
    return [];
  }
}

/**
 * Load connections from connections.json
 */
export async function loadConnections(): Promise<Connection[]> {
  try {
    const filePath = path.join(DATA_ROOT, 'connections.json');
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    const validated = ConnectionsCollectionSchema.parse(data);
    return validated.connections;
  } catch (error) {
    console.error('Failed to load connections:', error);
    return [];
  }
}

/**
 * Recursively find all .journey.json files
 */
async function findJourneyFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findJourneyFiles(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.journey.json')) {
        // Return relative path from baseDir
        const relativePath = path.relative(baseDir, fullPath);
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Failed to read directory ${dir}:`, error);
  }

  return files;
}

/**
 * Load a single journey file
 */
export async function loadJourney(relativePath: string): Promise<Journey | null> {
  try {
    const filePath = path.join(DATA_ROOT, 'journeys', relativePath);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    const validated = JourneySchema.parse(data);
    return validated;
  } catch (error) {
    console.error(`Failed to load journey ${relativePath}:`, error);
    return null;
  }
}

/**
 * Load all journeys with their metadata
 */
export async function loadAllJourneys(): Promise<Array<{ journey: Journey; path: string }>> {
  try {
    const journeysDir = path.join(DATA_ROOT, 'journeys');
    const files = await findJourneyFiles(journeysDir);

    // Sort alphabetically
    files.sort();

    const journeys: Array<{ journey: Journey; path: string }> = [];

    for (const file of files) {
      const journey = await loadJourney(file);
      if (journey) {
        journeys.push({ journey, path: file });
      }
    }

    return journeys;
  } catch (error) {
    console.error('Failed to load all journeys:', error);
    return [];
  }
}

/**
 * Save systems to systems.json
 */
export async function saveSystems(systems: System[]): Promise<void> {
  const filePath = path.join(DATA_ROOT, 'systems.json');
  const data = { systems };
  const validated = SystemsCollectionSchema.parse(data);
  await fs.writeFile(filePath, JSON.stringify(validated, null, 2), 'utf-8');
}
