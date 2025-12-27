import { NextResponse } from 'next/server';
import { flashcards } from '@/lib/db';

export async function GET() {
  try {
    const dates = flashcards.getVisitedDates();
    return NextResponse.json({ success: true, dates: dates.map(d => d.visitDate) });
  } catch (error) {
    console.error('Error fetching visited dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visited dates' },
      { status: 500 }
    );
  }
}

