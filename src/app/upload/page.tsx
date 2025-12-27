'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Folder {
  id: number;
  name: string;
  createdAt: number;
}

export default function UploadPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [uploadType, setUploadType] = useState<'zip' | 'single'>('zip');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [notes, setNotes] = useState('');

  const loadFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/folders');
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress('Uploading ZIP file...');

    try {
      const formData = new FormData();
      formData.append('zip', file);
      if (selectedFolderId !== null) {
        formData.append('folderId', selectedFolderId.toString());
      }

      const res = await fetch('/api/upload-zip', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Failed to upload ZIP';
        const details = data.details ? ` (${data.details})` : '';
        throw new Error(errorMsg + details);
      }

      if (data.errors && data.errors.length > 0) {
        const errorList = data.errors.map((e: any) => `${e.filename}: ${e.error}`).join(', ');
        setUploadProgress(`Created ${data.created} flashcards, but ${data.errors.length} failed: ${errorList}`);
      } else {
        setUploadProgress(`Successfully created ${data.created} flashcards!`);
      }
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(`Error: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleSingleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress('Uploading image...');

    try {
      // First, upload the image to freeimage.host
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      let uploadData;
      try {
        uploadData = await uploadRes.json();
      } catch (jsonError) {
        const text = await uploadRes.text();
        throw new Error(`Failed to parse response: ${text}`);
      }

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || uploadData.details || 'Failed to upload image');
      }

      setUploadProgress('Creating flashcard...');

      // Then, create the flashcard with the notes
      const cardRes = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadData.imageUrl,
          thumbUrl: uploadData.thumbUrl,
          notes: notes.trim(),
          folderId: selectedFolderId,
        }),
      });

      const cardData = await cardRes.json();

      if (!cardRes.ok) {
        throw new Error(cardData.error || 'Failed to create flashcard');
      }

      setUploadProgress('Flashcard created successfully!');
      setNotes('');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(`Error: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Flashcards</h1>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            ← Back to Flashcards
          </button>
        </div>

        {/* Upload Type Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setUploadType('zip')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                uploadType === 'zip'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bulk Upload (ZIP)
            </button>
            <button
              onClick={() => setUploadType('single')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                uploadType === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Single Image
            </button>
          </div>

          {/* Folder Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder (Optional)
            </label>
            <select
              value={selectedFolderId === null ? '' : selectedFolderId}
              onChange={(e) =>
                setSelectedFolderId(
                  e.target.value === '' ? null : parseInt(e.target.value, 10)
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* ZIP Upload */}
          {uploadType === 'zip' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload ZIP File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleZipUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="zip-upload"
                />
                <label
                  htmlFor="zip-upload"
                  className="cursor-pointer block"
                >
                  <div className="text-gray-600 mb-2">
                    Click to select a ZIP file
                  </div>
                  <div className="text-sm text-gray-500">
                    ZIP file containing images (JPG, PNG, GIF, etc.)
                  </div>
                </label>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                All images in the ZIP will be extracted and uploaded. Notes will be empty and can be added later.
              </p>
            </div>
          )}

          {/* Single Image Upload */}
          {uploadType === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSingleUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer block"
                >
                  <div className="text-gray-600 mb-2">
                    Click to select an image
                  </div>
                  <div className="text-sm text-gray-500">
                    JPG, PNG, GIF, WebP, etc.
                  </div>
                </label>
              </div>

              {/* Notes Input for Single Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes for this flashcard..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={6}
                />
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className={`mt-4 p-4 rounded-lg ${
              uploadProgress.startsWith('Error')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}>
              {uploadProgress}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

