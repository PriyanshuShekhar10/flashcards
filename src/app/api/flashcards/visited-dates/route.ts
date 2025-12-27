import { NextResponse } from 'next/server';
import { flashcards } from '@/lib/db';

export async function GET() {
  try {
    const dates = await flashcards.getVisitedDates();
    return NextResponse.json({ success: true, dates: dates.map(d => d.date) });
  } catch (error) {
    console.error('Error fetching visited dates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch visited dates', details: errorMessage },
      { status: 500 }
    );
  }
}

