import { NextRequest, NextResponse } from 'next/server';
import FormData from 'form-data';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeFetchModule = require('node-fetch');
// node-fetch v2 exports as a module, need to access default
const fetch = nodeFetchModule.default || nodeFetchModule;

const FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';
const FREEIMAGE_UPLOAD_URL = 'https://freeimage.host/api/1/upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create form data for freeimage.host using form-data package
    const uploadFormData = new FormData();
    uploadFormData.append('key', FREEIMAGE_API_KEY);
    uploadFormData.append('action', 'upload');
    uploadFormData.append('source', buffer, {
      filename: file.name,
      contentType: file.type,
    });
    uploadFormData.append('format', 'json');

    // Upload to freeimage.host using node-fetch (better form-data support)
    const response = await fetch(FREEIMAGE_UPLOAD_URL, {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FreeImage.host error:', errorText);
      return NextResponse.json(
        { error: 'Failed to upload image to freeimage.host' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract image URL and thumb URL from response
    const imageUrl = data.image?.url || data.display_url || data.url;
    const thumbUrl = data.thumb?.url || data.thumbnail_url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL in response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      thumbUrl,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
        width: data.image?.width,
        height: data.image?.height,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

