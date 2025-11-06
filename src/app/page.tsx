import { Explorer } from '@/components/Explorer';
import { loadSystems, loadConnections, loadAllJourneys } from '@/lib/data';

export default async function Home() {
  const systems = await loadSystems();
  const connections = await loadConnections();
  const journeyData = await loadAllJourneys();

  const journeys = journeyData.map(({ journey, path }) => ({
    id: journey.id,
    name: journey.name,
    label: journey.label,
    path: `journeys/${path}`,
    tags: journey.tags,
  }));

  return <Explorer initialSystems={systems} initialConnections={connections} initialJourneys={journeys} />;
}
