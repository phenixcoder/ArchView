import { NextResponse } from 'next/server';
import { loadConnections } from '@/lib/data';

export async function GET() {
  try {
    const connections = await loadConnections();
    return NextResponse.json({ connections });
  } catch (error) {
    console.error('Failed to load connections:', error);
    return NextResponse.json(
      { error: 'Failed to load connections' },
      { status: 500 }
    );
  }
}
