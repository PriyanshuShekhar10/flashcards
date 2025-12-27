import { NextRequest, NextResponse } from 'next/server';
import { folders } from '@/lib/db';

export async function GET() {
  try {
    const allFolders = await folders.getAll();
    return NextResponse.json({ success: true, folders: allFolders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch folders', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    const folder = await folders.create(name.trim());
    return NextResponse.json({ success: true, folder }, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create folder', details: errorMessage },
      { status: 500 }
    );
  }
}

