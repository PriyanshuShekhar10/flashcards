'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FlashcardViewer from '@/components/FlashcardViewer';

interface Flashcard {
  id: number;
  imageUrl: string;
  thumbUrl: string | null;
  notes: string;
  folderId: number | null;
  starred: number;
  lastVisited: number | null;
  createdAt: number;
}

interface Folder {
  id: number;
  name: string;
  createdAt: number;
}

export default function Home() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [visitedDates, setVisitedDates] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null | 'starred'>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isShuffled, setIsShuffled] = useState(false);

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

  const loadVisitedDates = useCallback(async () => {
    try {
      const res = await fetch('/api/flashcards/visited-dates');
      const data = await res.json();
      if (data.success) {
        setVisitedDates(data.dates);
      }
    } catch (error) {
      console.error('Failed to load visited dates:', error);
    }
  }, []);

  const loadFlashcards = useCallback(async (folderId: number | null | 'starred' = null, date?: string | null) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (folderId === 'starred') {
        params.append('starred', 'true');
      } else if (folderId !== null && folderId !== undefined) {
        params.append('folderId', folderId.toString());
      }
      
      if (date) {
        params.append('date', date);
      }
      
      const url = `/api/flashcards${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setFlashcards(data.flashcards);
        setCurrentIndex(0);
        setIsShuffled(false);
      }
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
    loadVisitedDates();
    loadFlashcards(null);
  }, [loadFolders, loadVisitedDates, loadFlashcards]);

  const handleShuffle = () => {
    const shuffled = [...flashcards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsShuffled(true);
  };

  const handleFolderChange = (folderId: number | null | 'starred', date?: string | null) => {
    setSelectedFolderId(folderId);
    setSelectedDate(date || null);
    loadFlashcards(folderId, date);
  };

  const handleUpdateNotes = async (id: number, notes: string) => {
    try {
      const res = await fetch(`/api/flashcards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error('Failed to update notes');

      // Update local state
      setFlashcards((prev) =>
        prev.map((card) => (card.id === id ? { ...card, notes } : card))
      );
    } catch (error) {
      console.error('Failed to update notes:', error);
      throw error;
    }
  };

  const handleToggleStar = async (id: number) => {
    try {
      const res = await fetch(`/api/flashcards/${id}/star`, {
        method: 'POST',
      });

      let errorData;
      try {
        errorData = await res.json();
      } catch (e) {
        errorData = { error: 'Failed to parse response' };
      }

      if (!res.ok) {
        throw new Error(errorData.error || errorData.details || 'Failed to toggle star');
      }

      const data = errorData;
      if (data.success) {
        // Update local state
        setFlashcards((prev) =>
          prev.map((card) => (card.id === id ? { ...card, starred: data.flashcard.starred } : card))
        );
        // Reload visited dates in case we need to refresh
        loadVisitedDates();
      }
    } catch (error) {
      console.error('Failed to toggle star:', error);
      alert(`Failed to toggle star: ${(error as Error).message}`);
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete flashcard');

      // Remove from local state
      const newCards = flashcards.filter((card) => card.id !== id);
      setFlashcards(newCards);

      // Adjust current index if needed
      if (currentIndex >= newCards.length && newCards.length > 0) {
        setCurrentIndex(newCards.length - 1);
      } else if (newCards.length === 0) {
        setCurrentIndex(0);
      }
      
      // Reload visited dates
      loadVisitedDates();
    } catch (error) {
      console.error('Failed to delete flashcard:', error);
      alert('Failed to delete flashcard');
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  Flashcards
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get started by uploading your first cards
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => router.push('/upload')}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all font-medium flex items-center gap-2 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Upload</span>
                </button>
                <button
                  onClick={() => router.push('/folders')}
                  className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 shadow-md hover:shadow-lg transition-all font-medium border border-gray-200 dark:border-slate-700 text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Folders</span>
                  <span className="sm:hidden">📁</span>
                </button>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-12 text-center border border-gray-100 dark:border-slate-700">
            <div className="mb-6">
              <svg className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No flashcards yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Start building your collection by uploading images</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/upload')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload ZIP File
              </button>
              <button
                onClick={() => router.push('/upload')}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Single Image
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Flashcards
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => router.push('/upload')}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all font-medium flex items-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Upload</span>
              </button>
              <button
                onClick={() => router.push('/folders')}
                className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 shadow-md hover:shadow-lg transition-all font-medium border border-gray-200 dark:border-slate-700 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Folders</span>
                <span className="sm:hidden">📁</span>
              </button>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700">
            {/* Folder Filter */}
            <div className="flex-1 w-full sm:min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Filter
              </label>
              <select
                value={selectedFolderId === null ? 'all' : selectedFolderId === 'starred' ? 'starred' : selectedFolderId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'all') {
                    handleFolderChange(null);
                  } else if (value === 'starred') {
                    handleFolderChange('starred');
                  } else if (value.startsWith('date-')) {
                    const date = value.replace('date-', '');
                    handleFolderChange(null, date);
                  } else {
                    handleFolderChange(parseInt(value, 10));
                  }
                }}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 font-medium text-sm sm:text-base"
              >
                <option value="all">📁 All Folders</option>
                <option value="starred">⭐ Starred</option>
                <optgroup label="Regular Folders">
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </optgroup>
                {visitedDates.length > 0 && (
                  <optgroup label="Visited Dates">
                    {visitedDates.map((date) => (
                      <option key={date} value={`date-${date}`}>
                        📅 {new Date(date).toLocaleDateString()}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Shuffle Button */}
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide sm:opacity-0 sm:h-0 sm:mb-0">
                Action
              </label>
              <button
                onClick={handleShuffle}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg ${
                  isShuffled
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
              >
                <span className="flex items-center justify-center gap-2 text-sm sm:text-base">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isShuffled ? 'Shuffled' : 'Shuffle'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Flashcard Viewer */}
        {currentCard && (
          <FlashcardViewer
            flashcard={currentCard}
            onNext={handleNext}
            onPrev={handlePrev}
            onDelete={handleDelete}
            onUpdateNotes={handleUpdateNotes}
            onToggleStar={handleToggleStar}
            hasNext={currentIndex < flashcards.length - 1}
            hasPrev={currentIndex > 0}
          />
        )}
      </div>
    </div>
  );
}
