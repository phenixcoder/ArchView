import { Journey, Owner, Doc } from './schema';
import { deduplicateBy } from './utils';
import { loadAllJourneys, loadConnections } from './data';

/**
 * Consolidate all journeys into a single "all" journey
 */
export async function consolidateAllJourneys(): Promise<Journey> {
  const journeyData = await loadAllJourneys();
  const connections = await loadConnections();

  const connSet = new Set<string>();
  const sysSet = new Set<string>();
  const allOwners: Owner[] = [];
  const allDocs: Doc[] = [];
  const allTags: string[] = [];

  // Collect data from all journeys
  for (const { journey } of journeyData) {
    // Add connections
    journey.connections.forEach((c) => connSet.add(c));

    // Add systems if specified
    if (journey.systems) {
      journey.systems.forEach((s) => sysSet.add(s));
    }

    // Add owners
    if (journey.owners) {
      allOwners.push(...journey.owners);
    }

    // Add docs
    if (journey.docs) {
      allDocs.push(...journey.docs);
    }

    // Add tags
    if (journey.tags) {
      allTags.push(...journey.tags);
    }
  }

  // Derive systems from connections if not explicitly specified
  const connectionIds = Array.from(connSet);
  const relevantConnections = connections.filter((c) => connectionIds.includes(c.id));

  for (const conn of relevantConnections) {
    sysSet.add(conn.from);
    sysSet.add(conn.to);
  }

  // Deduplicate owners by name+email+slack
  const uniqueOwners = deduplicateBy(
    allOwners,
    (o) => `${o.name}|${o.email || ''}|${o.slack || ''}`
  );

  // Deduplicate docs by title+url
  const uniqueDocs = deduplicateBy(allDocs, (d) => `${d.title}|${d.url}`);

  // Deduplicate tags
  const uniqueTags = Array.from(new Set(allTags));

  return {
    id: 'all',
    name: 'All Journeys',
    label: '🌐 All Journeys',
    description: 'Consolidated view of all journeys in the system',
    connections: Array.from(connSet),
    systems: Array.from(sysSet),
    owners: uniqueOwners,
    docs: uniqueDocs,
    tags: uniqueTags,
  };
}
