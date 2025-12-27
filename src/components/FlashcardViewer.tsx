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
  
  // Detect iOS devices
  const [isIOS, setIsIOS] = useState(false);
  
  useEffect(() => {
    // Detect iOS - improved detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform?.toLowerCase() || '';
    const isIOSDevice = 
      /iphone|ipad|ipod/.test(userAgent) || 
      (platform === 'macintel' && navigator.maxTouchPoints > 1) ||
      /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
    
    // Also check if Fullscreen API is available
    const hasFullscreenAPI = !!(document.documentElement.requestFullscreen || 
      (document.documentElement as any).webkitRequestFullscreen ||
      (document.documentElement as any).mozRequestFullScreen ||
      (document.documentElement as any).msRequestFullscreen);
    
    // If on iOS and no Fullscreen API, use CSS fallback
    if (isIOSDevice && !hasFullscreenAPI) {
      setIsIOS(true);
    }
  }, []);

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
      if (isIOS) {
        // iOS doesn't support Fullscreen API, use CSS-based pseudo-fullscreen
        setIsFullscreen(true);
        // Prevent body scroll when in fullscreen mode
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        // Prevent iOS Safari from bouncing when scrolling
        document.documentElement.style.overflow = 'hidden';
      } else if (container.requestFullscreen) {
        container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
          // Fallback if fullscreen is denied
          setIsFullscreen(true);
          document.body.style.overflow = 'hidden';
        });
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if ((container as any).mozRequestFullScreen) {
        (container as any).mozRequestFullScreen();
        setIsFullscreen(true);
      } else if ((container as any).msRequestFullscreen) {
        (container as any).msRequestFullscreen();
        setIsFullscreen(true);
      } else {
        // Fallback to CSS-based fullscreen if API is not supported
        setIsFullscreen(true);
        document.body.style.overflow = 'hidden';
      }
    } else {
      // Exit fullscreen
      if (isIOS || !document.exitFullscreen) {
        // CSS-based fullscreen exit
        setIsFullscreen(false);
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.documentElement.style.overflow = '';
      } else if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
          document.body.style.overflow = '';
        }).catch(() => {
          setIsFullscreen(false);
          document.body.style.overflow = '';
        });
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
        setIsFullscreen(false);
        document.body.style.overflow = '';
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
        setIsFullscreen(false);
        document.body.style.overflow = '';
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
        setIsFullscreen(false);
        document.body.style.overflow = '';
      }
    }
  };

  // Listen for fullscreen changes (browsers handle Escape key automatically)
  useEffect(() => {
    if (isIOS) return; // iOS doesn't support Fullscreen API events

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Restore body scroll when exiting fullscreen
      if (!document.fullscreenElement) {
        document.body.style.overflow = '';
      }
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
  }, [isIOS]);
  
  // Cleanup body overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <>
      {/* iOS Fullscreen Overlay */}
      {isFullscreen && isIOS && (
        <div 
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={handleFullscreen}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            minHeight: '-webkit-fill-available',
            touchAction: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            zIndex: 9999,
          }}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              minHeight: '-webkit-fill-available',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                src={flashcard.imageUrl}
                alt="Flashcard fullscreen"
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            {/* Exit Fullscreen Button for iOS */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFullscreen();
              }}
              className="absolute bg-white/90 backdrop-blur-sm active:bg-white text-gray-700 p-3 sm:p-4 rounded-xl transition-all z-10 shadow-lg border border-gray-200"
              style={{
                top: `max(env(safe-area-inset-top, 1rem), 1rem)`,
                right: `max(env(safe-area-inset-right, 1rem), 1rem)`,
                minWidth: '44px',
                minHeight: '44px',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
              aria-label="Exit Fullscreen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className={`flex flex-col items-center w-full max-w-3xl mx-auto px-4 py-6 ${isFullscreen && isIOS ? 'hidden' : ''}`}>
        {/* Flashcard Container */}
        <div 
          id="flashcard-image-container"
          className={`relative w-full aspect-[4/3] mb-8 perspective-1000 shadow-2xl rounded-2xl overflow-hidden ${isFullscreen && !isIOS ? 'fixed inset-0 z-[9999] w-screen h-screen m-0 rounded-none' : ''}`}
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
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 overflow-hidden"
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
    </>
  );
}

