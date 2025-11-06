import { NextResponse } from 'next/server';
import { loadAllJourneys } from '@/lib/data';
import { JourneyListItem } from '@/lib/schema';

export async function GET() {
  try {
    const journeyData = await loadAllJourneys();

    const items: JourneyListItem[] = journeyData.map(({ journey, path }) => ({
      id: journey.id,
      name: journey.name,
      label: journey.label,
      path: `journeys/${path}`,
      tags: journey.tags,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to load journeys:', error);
    return NextResponse.json(
      { error: 'Failed to load journeys' },
      { status: 500 }
    );
  }
}
