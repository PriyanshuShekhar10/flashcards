import { NextRequest, NextResponse } from 'next/server';
import { flashcards } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as either a Promise (Next.js 15+) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = parseInt(resolvedParams.id, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid flashcard ID' },
        { status: 400 }
      );
    }
    
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    await flashcards.update(id, { lastVisited: now });
    const updatedCard = await flashcards.getById(id);

    if (!updatedCard) {
      return NextResponse.json(
        { error: 'Flashcard not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, flashcard: updatedCard });
  } catch (error) {
    console.error('Error updating visit:', error);
    return NextResponse.json(
      { error: 'Failed to update visit timestamp' },
      { status: 500 }
    );
  }
}

