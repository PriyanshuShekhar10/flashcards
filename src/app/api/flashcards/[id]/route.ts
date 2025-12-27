import { NextRequest, NextResponse } from 'next/server';
import { flashcards } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as either a Promise (Next.js 15+) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = parseInt(resolvedParams.id, 10);
    const card = flashcards.getById(id);

    if (!card) {
      return NextResponse.json(
        { error: 'Flashcard not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, flashcard: card });
  } catch (error) {
    console.error('Error fetching flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcard' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as either a Promise (Next.js 15+) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = parseInt(resolvedParams.id, 10);
    const body = await request.json();
    const { notes, folderId } = body;

    const updates: { notes?: string; folderId?: number | null } = {};
    if (notes !== undefined) updates.notes = notes;
    if (folderId !== undefined) updates.folderId = folderId;

    flashcards.update(id, updates);
    const updatedCard = flashcards.getById(id);

    return NextResponse.json({ success: true, flashcard: updatedCard });
  } catch (error) {
    console.error('Error updating flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to update flashcard' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as either a Promise (Next.js 15+) or object (Next.js 14)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = parseInt(resolvedParams.id, 10);
    flashcards.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to delete flashcard' },
      { status: 500 }
    );
  }
}

