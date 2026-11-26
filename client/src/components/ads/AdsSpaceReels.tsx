import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Share2,
  MessageCircle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Plus,
  Trash2,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Check,
  Copy,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';
import { Advertisement } from '../../types';
import { CreateAdModal } from './CreateAdModal';

interface AdsSpaceReelsProps {
  onOpenChatWithUser: (userId: string) => void;
}

export const AdsSpaceReels: React.FC<AdsSpaceReelsProps> = ({ onOpenChatWithUser }) => {
  const { advertisements, likeAdvertisement, shareAdvertisement, deleteAdvertisement } = useSocial();
  const { user } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [showHeartAnim, setShowHeartAnim] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sharingAd, setSharingAd] = useState<Advertisement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Synchronize active reel index based on scroll position
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight > 0) {
      const index = Math.round(scrollTop / clientHeight);
      if (index !== currentIndex && index >= 0 && index < advertisements.length) {
        setCurrentIndex(index);
      }
    }
  };

  // Autoplay visible video, pause others
  useEffect(() => {
    advertisements.forEach((ad, idx) => {
      const vid = videoRefs.current[ad.id];
      if (vid) {
        if (idx === currentIndex) {
          vid.currentTime = 0;
          vid.play().then(() => {
            setIsPlaying((prev) => ({ ...prev, [ad.id]: true }));
          }).catch(() => {
            // Autoplay with audio might be blocked by browser policy; stays muted
            setIsPlaying((prev) => ({ ...prev, [ad.id]: false }));
          });
        } else {
          vid.pause();
          setIsPlaying((prev) => ({ ...prev, [ad.id]: false }));
        }
      }
    });
  }, [currentIndex, advertisements]);

  const togglePlayPause = (adId: string) => {
    const vid = videoRefs.current[adId];
    if (!vid) return;

    if (vid.paused) {
      vid.play();
      setIsPlaying((prev) => ({ ...prev, [adId]: true }));
    } else {
      vid.pause();
      setIsPlaying((prev) => ({ ...prev, [adId]: false }));
    }
  };

  const handleDoubleTap = (ad: Advertisement) => {
    setShowHeartAnim(ad.id);
    setTimeout(() => setShowHeartAnim(null), 900);
    if (!ad.likes.includes(user?.id || '')) {
      likeAdvertisement(ad.id);
    }
  };

  const scrollToNext = () => {
    if (currentIndex < advertisements.length - 1 && containerRef.current) {
      const nextIdx = currentIndex + 1;
      containerRef.current.scrollTo({
        top: nextIdx * containerRef.current.clientHeight,
        behavior: 'smooth',
      });
      setCurrentIndex(nextIdx);
    }
  };

  const scrollToPrev = () => {
    if (currentIndex > 0 && containerRef.current) {
      const prevIdx = currentIndex - 1;
      containerRef.current.scrollTo({
        top: prevIdx * containerRef.current.clientHeight,
        behavior: 'smooth',
      });
      setCurrentIndex(prevIdx);
    }
  };

  const handleShareClick = async (ad: Advertisement) => {
    await shareAdvertisement(ad.id);
    const shareUrl = `${window.location.origin}${window.location.pathname}#ad-${ad.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.headline,
          text: `${ad.headline} - Posted by ${ad.userName} on AAM Sovereign Ads Space`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share unsupported, fallback to modal
      }
    }
    setSharingAd(ad);
  };

  const handleCopyLink = (ad: Advertisement) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#ad-${ad.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCtaAction = (ad: Advertisement) => {
    if (ad.ctaLink && (ad.ctaLink.startsWith('http://') || ad.ctaLink.startsWith('https://'))) {
      window.open(ad.ctaLink, '_blank', 'noopener,noreferrer');
    } else {
      onOpenChatWithUser(ad.userId);
    }
  };

  const toggleCaption = (adId: string) => {
    setExpandedCaptions((prev) => ({ ...prev, [adId]: !prev[adId] }));
  };

  return (
    <div className="flex-1 bg-black flex flex-col h-full overflow-hidden select-none relative">
      {/* Top Floating Glass Header */}
      <div className="absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between z-30 pointer-events-auto">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-orange-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                Ads Space
              </h2>
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold backdrop-blur-md">
                Contacts Feed
              </span>
            </div>
            <p className="text-[10px] text-slate-300/80 hidden sm:block">
              Full-screen vertical showcase from your trusted contact network
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {advertisements.length > 0 && (
            <span className="text-[11px] font-mono text-slate-300 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              {currentIndex + 1} / {advertisements.length}
            </span>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Post Ad</span>
          </button>
        </div>
      </div>

      {/* Vertical Snap Scroll Reels Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none relative"
        style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {advertisements.length === 0 ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-base font-bold text-slate-200">No advertisements posted yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Be the first to showcase your business, craft, or offerings to all your accepted contacts!
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/20"
            >
              Post First Advertisement
            </button>
          </div>
        ) : (
          advertisements.map((ad, idx) => {
            const isLiked = ad.likes.includes(user?.id || '');
            const isAuthor = ad.userId === user?.id;
            const isCaptionExpanded = !!expandedCaptions[ad.id];

            return (
              <div
                key={ad.id}
                className="h-full w-full snap-start relative flex items-center justify-center bg-black overflow-hidden"
              >
                {/* Media Container */}
                <div
                  onDoubleClick={() => handleDoubleTap(ad)}
                  onClick={() => ad.mediaType === 'video' && togglePlayPause(ad.id)}
                  className="w-full h-full relative cursor-pointer flex items-center justify-center"
                >
                  {ad.mediaType === 'video' ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[ad.id] = el;
                      }}
                      src={ad.mediaUrl}
                      playsInline
                      loop
                      muted={isMuted}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={ad.mediaUrl}
                      alt={ad.headline}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Play/Pause Center Indicator */}
                  {ad.mediaType === 'video' && !isPlaying[ad.id] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
                      <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/20">
                        <Play className="w-8 h-8 fill-white translate-x-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Double-tap Floating Heart Animation */}
                  {showHeartAnim === ad.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping duration-700">
                      <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl" />
                    </div>
                  )}

                  {/* Gradient Overlays for readable text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Right Side Floating Actions Bar */}
                <div className="absolute right-3 bottom-20 sm:bottom-16 flex flex-col items-center space-y-4 z-20">
                  {/* Like Button */}
                  <button
                    onClick={() => likeAdvertisement(ad.id)}
                    className="flex flex-col items-center group transition active:scale-90"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition shadow-lg ${
                        isLiked
                          ? 'bg-rose-500/30 text-rose-500 ring-2 ring-rose-500/60'
                          : 'bg-black/50 text-white hover:bg-black/70 ring-1 ring-white/20'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </div>
                    <span className="text-[11px] font-bold text-white mt-1 drop-shadow-md">
                      {ad.likes.length}
                    </span>
                  </button>

                  {/* Inquire on Chat */}
                  <button
                    onClick={() => onOpenChatWithUser(ad.userId)}
                    className="flex flex-col items-center group transition active:scale-90"
                    title="Inquire directly on Chat"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md ring-1 ring-white/20 shadow-lg">
                      <MessageCircle className="w-6 h-6 text-amber-400" />
                    </div>
                    <span className="text-[11px] font-bold text-white mt-1 drop-shadow-md">
                      Chat
                    </span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShareClick(ad)}
                    className="flex flex-col items-center group transition active:scale-90"
                  >
                    <div className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md ring-1 ring-white/20 shadow-lg">
                      <Share2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-white mt-1 drop-shadow-md">
                      {ad.sharesCount || 0}
                    </span>
                  </button>

                  {/* Audio Mute/Unmute (for video) */}
                  {ad.mediaType === 'video' && (
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md ring-1 ring-white/20 shadow-lg transition active:scale-90"
                      title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5 text-slate-300" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
                    </button>
                  )}

                  {/* Delete (if author) */}
                  {isAuthor && (
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this advertisement from contacts feed?')) {
                          deleteAdvertisement(ad.id);
                        }
                      }}
                      className="w-11 h-11 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 flex items-center justify-center backdrop-blur-md ring-1 ring-rose-500/30 shadow-lg transition active:scale-90"
                      title="Delete My Advertisement"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Bottom Information Card Overlay */}
                <div className="absolute bottom-3 sm:bottom-4 left-3 right-16 sm:left-4 sm:right-20 z-20 pointer-events-auto text-left">
                  {/* Author / Contact Tag */}
                  <div
                    onClick={() => onOpenChatWithUser(ad.userId)}
                    className="flex items-center space-x-2.5 cursor-pointer mb-2 w-fit group"
                  >
                    <img
                      src={
                        ad.userAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                      }
                      alt={ad.userName}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-400 shadow-md group-hover:scale-105 transition"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition drop-shadow-md">
                          {ad.userName}
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Contact
                        </span>
                      </div>
                      {ad.userPhone && (
                        <p className="text-[10px] text-slate-300/80">{ad.userPhone}</p>
                      )}
                    </div>
                  </div>

                  {/* Headline & Price Pill */}
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {ad.price && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20">
                        {ad.price}
                      </span>
                    )}
                    <h3 className="text-xs sm:text-sm font-extrabold text-white leading-snug drop-shadow-md">
                      {ad.headline}
                    </h3>
                  </div>

                  {/* Description / Caption */}
                  {ad.caption && (
                    <div className="mb-2">
                      <p
                        className={`text-xs text-slate-200/90 leading-relaxed drop-shadow ${
                          isCaptionExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {ad.caption}
                      </p>
                      {ad.caption.length > 90 && (
                        <button
                          onClick={() => toggleCaption(ad.id)}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 mt-0.5"
                        >
                          {isCaptionExpanded ? 'Show less' : '...more'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {ad.tags && ad.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {ad.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-slate-200 border border-white/10"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Primary CTA Button */}
                  <div className="pt-0.5">
                    <button
                      onClick={() => handleCtaAction(ad)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-orange-500/30 active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                      <span>{ad.ctaText || 'Inquire on Chat'}</span>
                      {ad.ctaLink && (ad.ctaLink.startsWith('http://') || ad.ctaLink.startsWith('https://')) ? (
                        <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Navigation Controls (Up / Down chevrons for Desktop / Web users) */}
      {advertisements.length > 1 && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col space-y-2 z-20 hidden md:flex pointer-events-auto">
          <button
            onClick={scrollToPrev}
            disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md ring-1 ring-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            title="Previous Advertisement"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <button
            onClick={scrollToNext}
            disabled={currentIndex === advertisements.length - 1}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md ring-1 ring-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            title="Next Advertisement"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Share Modal Dialog */}
      {sharingAd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Share Advertisement</span>
              </h3>
              <button
                onClick={() => setSharingAd(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center space-x-3">
                <img
                  src={sharingAd.mediaUrl}
                  alt={sharingAd.headline}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-200 truncate">{sharingAd.headline}</h4>
                  <p className="text-[11px] text-amber-400 font-semibold">{sharingAd.price || 'Contact Offer'}</p>
                  <p className="text-[10px] text-slate-400">By {sharingAd.userName}</p>
                </div>
              </div>

              {/* Inquire on chat option */}
              <button
                onClick={() => {
                  onOpenChatWithUser(sharingAd.userId);
                  setSharingAd(null);
                }}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center space-x-2 transition"
              >
                <MessageCircle className="w-4 h-4 text-amber-400" />
                <span>Message Advertiser in Private Chat</span>
              </button>

              {/* Copy link button */}
              <button
                onClick={() => handleCopyLink(sharingAd)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold flex items-center justify-center space-x-2 transition shadow-md shadow-orange-500/20"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Advertisement Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Advertisement Modal */}
      {showCreateModal && (
        <CreateAdModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};
