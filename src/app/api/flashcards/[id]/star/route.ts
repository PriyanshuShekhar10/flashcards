import { NextRequest, NextResponse } from 'next/server';
import { flashcards } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as either a Promise (Next.js 15+) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    
    console.log('Star route - params:', resolvedParams);
    console.log('Star route - id value:', resolvedParams.id);
    
    if (!resolvedParams.id) {
      console.error('ID is missing in params:', resolvedParams);
      return NextResponse.json(
        { error: 'Invalid flashcard ID - ID is missing', received: resolvedParams },
        { status: 400 }
      );
    }
    
    const id = parseInt(resolvedParams.id, 10);
    
    if (isNaN(id)) {
      console.error('Invalid ID (NaN):', resolvedParams.id, 'type:', typeof resolvedParams.id);
      return NextResponse.json(
        { error: 'Invalid flashcard ID', received: resolvedParams.id },
        { status: 400 }
      );
    }
    
    const updatedCard = await flashcards.toggleStar(id);

    if (!updatedCard) {
      return NextResponse.json(
        { error: 'Flashcard not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, flashcard: updatedCard });
  } catch (error) {
    console.error('Error toggling star:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to toggle star', details: errorMessage },
      { status: 500 }
    );
  }
}

