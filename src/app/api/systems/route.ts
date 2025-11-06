import { NextResponse } from 'next/server';
import { loadSystems, saveSystems } from '@/lib/data';
import { SystemsCollectionSchema } from '@/lib/schema';

export async function GET() {
  try {
    const systems = await loadSystems();
    return NextResponse.json({ systems });
  } catch (error) {
    console.error('Failed to load systems:', error);
    return NextResponse.json(
      { error: 'Failed to load systems' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = SystemsCollectionSchema.parse(body);

    await saveSystems(validated.systems);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save systems:', error);
    return NextResponse.json(
      { error: 'Failed to save systems' },
      { status: 500 }
    );
  }
}
