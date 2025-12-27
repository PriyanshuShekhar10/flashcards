'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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

interface FlashcardViewerProps {
  flashcard: Flashcard;
  onNext: () => void;
  onPrev: () => void;
  onDelete: (id: number) => void;
  onUpdateNotes: (id: number, notes: string) => Promise<void>;
  onToggleStar: (id: number) => Promise<void>;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function FlashcardViewer({
  flashcard,
  onNext,
  onPrev,
  onDelete,
  onUpdateNotes,
  onToggleStar,
  hasNext,
  hasPrev,
}: FlashcardViewerProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [notes, setNotes] = useState(flashcard.notes);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [starred, setStarred] = useState(flashcard.starred === 1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setNotes(flashcard.notes);
    setIsFlipped(false);
    setIsEditing(false);
    setStarred(flashcard.starred === 1);
    
    // Track visit when flashcard is viewed
    if (flashcard.id) {
      fetch(`/api/flashcards/${flashcard.id}/visit`, {
        method: 'POST',
      }).catch(console.error);
    }
  }, [flashcard.id]);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await onUpdateNotes(flashcard.id, notes);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this flashcard?')) {
      onDelete(flashcard.id);
    }
  };

  const handleToggleStar = async () => {
    try {
      await onToggleStar(flashcard.id);
      setStarred(!starred);
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const handleFullscreen = () => {
    const container = document.getElementById('flashcard-image-container');
    if (!container) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen().then(() => setIsFullscreen(true));
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen();
        setIsFullscreen(true);
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
        setIsFullscreen(false);
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
        setIsFullscreen(false);
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen changes (browsers handle Escape key automatically)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto px-4 py-6">
      {/* Flashcard Container */}
      <div 
        id="flashcard-image-container"
        className="relative w-full aspect-[4/3] mb-8 perspective-1000 shadow-2xl rounded-2xl overflow-hidden" 
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Side - Image */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden relative"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
            }}
          >
            <Image
              src={flashcard.imageUrl}
              alt="Flashcard front"
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            {/* Fullscreen Button - only show when not flipped */}
            {!isFlipped && (
              <button
                onClick={handleFullscreen}
                className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 p-3 rounded-xl transition-all z-10 shadow-lg hover:shadow-xl border border-gray-200 dark:border-slate-700"
                title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Back Side - Notes */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="flex-1 p-8 overflow-y-auto">
              {!isEditing && notes ? (
                <div className="h-full">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words text-lg leading-relaxed">
                    {notes}
                  </p>
                </div>
              ) : !isEditing && !notes ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <p className="text-gray-400 dark:text-gray-500 text-lg font-medium">No notes yet</p>
                    <p className="text-gray-300 dark:text-gray-600 text-sm mt-1">Click "Add Notes" to get started</p>
                  </div>
                </div>
              ) : (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-full p-4 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 text-lg"
                  placeholder="Enter your notes here..."
                  autoFocus
                />
              )}
            </div>
            {isEditing && (
              <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                <button
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 w-full">
        {/* Primary Actions */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={handleToggleStar}
            className={`py-3.5 px-4 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg ${
              starred
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
            title={starred ? 'Unstar' : 'Star this card'}
          >
            <span className="text-xl">{starred ? '★' : '☆'}</span>
          </button>
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="bg-gradient-to-r from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-slate-800 hover:to-slate-900 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all shadow-md hover:shadow-lg"
          >
            {isFlipped ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Notes
              </span>
            )}
          </button>
          {!isFlipped && (
            <button
              onClick={handleFullscreen}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
              title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
            >
              <span className="text-xl">{isFullscreen ? '⤓' : '⤢'}</span>
            </button>
          )}
          {isFlipped && <div />}
        </div>

        {/* Edit Notes Button (only on back side) */}
        {isFlipped && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {notes ? 'Edit Notes' : 'Add Notes'}
          </button>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className="flex-1 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-slate-700 py-3.5 px-6 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="flex-1 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-slate-700 py-3.5 px-6 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:hover:shadow-md flex items-center justify-center gap-2"
          >
            Next
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Card
        </button>
      </div>
    </div>
  );
}

