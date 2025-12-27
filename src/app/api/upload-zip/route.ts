import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import FormData from 'form-data';
import { flashcards } from '@/lib/db';

// Import node-fetch for form-data support (v2 works directly with require)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeFetch = require('node-fetch');

const FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';
const FREEIMAGE_UPLOAD_URL = 'https://freeimage.host/api/1/upload';

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
];

function isImageFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
}

async function uploadImageToFreeImage(buffer: Buffer, filename: string): Promise<{ imageUrl: string; thumbUrl?: string }> {
  const uploadFormData = new FormData();
  uploadFormData.append('key', FREEIMAGE_API_KEY);
  uploadFormData.append('action', 'upload');
  uploadFormData.append('source', buffer, {
    filename: filename,
    contentType: `image/${filename.split('.').pop()?.toLowerCase()}`,
  });
  uploadFormData.append('format', 'json');

  // Use nodeFetch (node-fetch) instead of native fetch
  if (typeof nodeFetch !== 'function') {
    console.error('nodeFetch is not a function:', typeof nodeFetch, nodeFetch);
    throw new Error('nodeFetch is not available');
  }
  
  const response = await nodeFetch(FREEIMAGE_UPLOAD_URL, {
    method: 'POST',
    body: uploadFormData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FreeImage.host error:', errorText);
    throw new Error('Failed to upload image to freeimage.host');
  }

  const data = await response.json();
  const imageUrl = data.image?.url || data.display_url || data.url;
  const thumbUrl = data.thumb?.url || data.thumbnail_url;

  if (!imageUrl) {
    throw new Error('No image URL in response');
  }

  return { imageUrl, thumbUrl };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const zipFile = formData.get('zip') as File;
    const folderIdParam = formData.get('folderId') as string | null;

    if (!zipFile) {
      return NextResponse.json({ error: 'No ZIP file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await zipFile.arrayBuffer();
    const zipBuffer = Buffer.from(bytes);

    // Extract ZIP
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    console.log(`Total entries in ZIP: ${zipEntries.length}`);
    
    // Log all entries for debugging
    zipEntries.forEach((entry, index) => {
      console.log(`Entry ${index}: name="${entry.name}", entryName="${entry.entryName}", isDirectory=${entry.isDirectory}`);
    });

    // Filter for image files - try both entryName and name
    const imageEntries = zipEntries.filter((entry) => {
      if (entry.isDirectory) return false;
      const name = entry.entryName || entry.name || '';
      const isImage = isImageFile(name);
      if (!isImage) {
        console.log(`Skipping non-image file: ${name}`);
      }
      return isImage;
    });

    console.log(`Found ${imageEntries.length} image entries`);

    if (imageEntries.length === 0) {
      const allFileNames = zipEntries
        .filter(e => !e.isDirectory)
        .map(e => e.entryName || e.name)
        .join(', ');
      return NextResponse.json(
        { 
          error: 'No image files found in ZIP',
          details: `Found ${zipEntries.length} total entries, ${zipEntries.filter(e => !e.isDirectory).length} files. Files: ${allFileNames || 'none'}` 
        },
        { status: 400 }
      );
    }

    const folderId = folderIdParam && folderIdParam !== 'null' 
      ? parseInt(folderIdParam, 10) 
      : null;

    // Upload each image and create flashcards
    const results = [];
    const errors = [];

    for (const entry of imageEntries) {
      try {
        const fileName = entry.entryName || entry.name || 'unknown';
        console.log(`Processing image: ${fileName}`);
        
        const imageBuffer = entry.getData();
        
        if (!imageBuffer || imageBuffer.length === 0) {
          throw new Error('Empty file data');
        }
        
        console.log(`Image buffer size: ${imageBuffer.length} bytes`);
        
        const { imageUrl, thumbUrl } = await uploadImageToFreeImage(
          imageBuffer,
          fileName
        );

        console.log(`Uploaded successfully: ${imageUrl}`);

        // Create flashcard with empty notes
        const card = flashcards.create(
          imageUrl,
          '',
          folderId,
          thumbUrl
        );

        console.log(`Created flashcard with ID: ${card.id}`);
        results.push(card);
      } catch (error) {
        const fileName = entry.entryName || entry.name || 'unknown';
        console.error(`Error processing ${fileName}:`, error);
        errors.push({ filename: fileName, error: (error as Error).message });
      }
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      errors: errors.length > 0 ? errors : undefined,
      flashcards: results,
    }, { status: 201 });
  } catch (error) {
    console.error('ZIP upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process ZIP file', details: (error as Error).message },
      { status: 500 }
    );
  }
}

