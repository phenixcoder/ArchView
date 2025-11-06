import { NextResponse } from 'next/server';
import { consolidateAllJourneys } from '@/lib/consolidate';

export async function GET() {
  try {
    const allJourney = await consolidateAllJourneys();
    return NextResponse.json(allJourney);
  } catch (error) {
    console.error('Failed to consolidate journeys:', error);
    return NextResponse.json(
      { error: 'Failed to consolidate journeys' },
      { status: 500 }
    );
  }
}
