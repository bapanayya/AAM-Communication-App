import React, { useState, useEffect } from 'react';
import { X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';

interface StoryViewerModalProps {
  initialGroupIndex: number;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ initialGroupIndex, onClose }) => {
  const { statusGroups, viewStatus } = useSocial();
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);

  const currentGroup = statusGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Mark viewed
  useEffect(() => {
    if (currentStory) {
      viewStatus(currentStory.id);
    }
  }, [currentStory, viewStatus]);

  // Auto advance timer
  useEffect(() => {
    const timer = setTimeout(() => {
      handleNext();
    }, 6000); // 6 seconds per story
    return () => clearTimeout(timer);
  }, [groupIndex, storyIndex, currentGroup]);

  const handleNext = () => {
    if (!currentGroup) return;
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex((prev) => prev + 1);
    } else if (groupIndex < statusGroups.length - 1) {
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((prev) => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(statusGroups[groupIndex - 1].stories.length - 1);
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-0 select-none">
      <div className="relative w-full max-w-sm h-full max-h-[85vh] sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col shadow-2xl">
        {/* Top Progress Bars */}
        <div className="absolute top-3 inset-x-3 flex items-center space-x-1.5 z-30">
          {currentGroup.stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  idx < storyIndex ? 'w-full' : idx === storyIndex ? 'w-full animate-pulse' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Top Bar: User info & Close */}
        <div className="absolute top-7 inset-x-4 flex items-center justify-between z-30 text-white">
          <div className="flex items-center space-x-2">
            <img
              src={currentGroup.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={currentGroup.user.displayName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white/50"
            />
            <div>
              <h4 className="text-xs font-bold leading-tight">{currentGroup.user.displayName}</h4>
              <p className="text-[10px] opacity-75">
                {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 24h Status
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-full bg-black/40 hover:bg-black/60 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Content Stage */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {currentStory.mediaType === 'text' ? (
            <div
              className={`w-full h-full p-8 flex items-center justify-center text-center font-bold text-lg sm:text-xl text-white bg-gradient-to-tr ${
                currentStory.backgroundGradient || 'from-amber-600 via-orange-600 to-rose-700'
              }`}
            >
              <p className="leading-relaxed drop-shadow-md">{currentStory.textContent}</p>
            </div>
          ) : currentStory.mediaType === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              loop
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img src={currentStory.mediaUrl} alt="Status" className="w-full h-full object-cover" />
              {currentStory.textContent && (
                <div className="absolute bottom-12 inset-x-4 p-3 bg-black/60 backdrop-blur-md rounded-2xl text-xs text-white text-center">
                  {currentStory.textContent}
                </div>
              )}
            </div>
          )}

          {/* Click hotspots for Next/Prev */}
          <div onClick={handlePrev} className="absolute left-0 top-16 bottom-0 w-1/3 cursor-pointer z-20" />
          <div onClick={handleNext} className="absolute right-0 top-16 bottom-0 w-1/3 cursor-pointer z-20" />
        </div>

        {/* Bottom Bar: Viewers */}
        <div className="p-3 bg-black/50 backdrop-blur-md flex items-center justify-between text-white text-xs z-30">
          <div className="flex items-center space-x-1.5 opacity-80">
            <Eye className="w-4 h-4" />
            <span className="text-[11px]">{currentStory.viewers.length} views</span>
          </div>
          {currentStory.userId === user?.id && (
            <span className="text-[10px] text-amber-400 font-semibold">Your Story</span>
          )}
        </div>
      </div>
    </div>
  );
};
