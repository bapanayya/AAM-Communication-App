import React, { useState } from 'react';
import { X, Video, Image, Tag, DollarSign, Sparkles, Send, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';

interface CreateAdModalProps {
  onClose: () => void;
}

const PRESET_MEDIA = [
  {
    label: 'Artisan Textiles (Photo)',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    headline: 'Handcrafted Heritage Silk Weaves & Festive Collection ✨',
    price: '₹4,999',
    caption: 'Exclusive pure mulberry silk handwoven by master artisans. Direct ethical craftsmanship with free pan-India express shipping.',
    tags: 'Handloom, Silk, Artisan, Festive',
  },
  {
    label: 'Mountain Camp (Photo)',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    headline: 'Himalayan Dark Sky Expedition & Astrophotography Retreat 🔭🌌',
    price: '₹18,500',
    caption: 'Join our 5-day deep-sky observation retreat in Spiti Valley. Guided telescope stargazing and heated mountain tents.',
    tags: 'Travel, Adventure, Himalayas',
  },
  {
    label: 'Tech Consulting (Photo)',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    headline: 'Sovereign P2P Architecture & WebRTC Engineering 🇮🇳',
    price: 'Free Consultation',
    caption: 'Zero-trust, client-bound encryption and local sovereign architecture advisory for developers.',
    tags: 'Tech, Software, Architecture',
  },
  {
    label: 'Organic Farm Harvest (Photo)',
    type: 'image' as const,
    url: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=1200&q=80',
    headline: 'Farm-Fresh Cold Pressed Organic Coconut & Sesame Oils 🥥',
    price: '₹650 / L',
    caption: 'Traditional wood-pressed unfiltered oils sourced directly from organic farms in Pollachi. Zero chemicals or preservatives.',
    tags: 'Organic, Health, FarmDirect',
  },
];

export const CreateAdModal: React.FC<CreateAdModalProps> = ({ onClose }) => {
  const { createAdvertisement } = useSocial();
  const { user } = useAuth();

  const [headline, setHeadline] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [mediaUrl, setMediaUrl] = useState('');
  const [price, setPrice] = useState('');
  const [ctaText, setCtaText] = useState('Inquire on Chat');
  const [ctaDestination, setCtaDestination] = useState<'chat' | 'url'>('chat');
  const [ctaUrl, setCtaUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: typeof PRESET_MEDIA[0]) => {
    setMediaType(preset.type);
    setMediaUrl(preset.url);
    setHeadline(preset.headline);
    setPrice(preset.price);
    setCaption(preset.caption);
    setTagsInput(preset.tags);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim()) {
      setError('Please provide an ad headline.');
      return;
    }
    if (!mediaUrl.trim()) {
      setError('Please provide a media URL or select a sample.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await createAdvertisement({
        headline: headline.trim(),
        caption: caption.trim(),
        mediaType,
        mediaUrl: mediaUrl.trim(),
        price: price.trim() || undefined,
        ctaText: ctaText.trim() || 'Inquire on Chat',
        ctaLink: ctaDestination === 'chat' ? user?.id : ctaUrl.trim() || user?.id,
        tags,
      });

      onClose();
    } catch (err: any) {
      console.error('Error creating advertisement:', err);
      setError(err.message || 'Failed to post advertisement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Post Advertisement</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Ads Space
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Broadcast full-screen vertical showcase to all your accepted contacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Quick Samples (1-Click Fill)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_MEDIA.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="text-left p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 text-[11px] text-slate-300 hover:text-amber-300 transition truncate"
                >
                  ⚡ {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Headline / Title <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Handcrafted Varanasi Silk Sarees & Kurtas"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Media Type & URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Media Format <span className="text-amber-400">*</span>
              </label>
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    mediaType === 'video'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    mediaType === 'image'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Image</span>
                </button>
              </div>
            </div>

            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder={mediaType === 'video' ? 'https://.../video.mp4' : 'https://.../photo.jpg'}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Price & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Price / Offer (Optional)</span>
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. ₹4,999 or Special 20% Off"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Tags (Comma separated)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Handloom, Festive, Organic"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description & Highlights
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your product, service, craft, or offering for your contacts..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Call-to-Action Settings */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                Action Button (Call To Action)
              </span>
              <div className="flex items-center space-x-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setCtaDestination('chat')}
                  className={`px-2 py-0.5 rounded-lg transition ${
                    ctaDestination === 'chat'
                      ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                      : 'text-slate-400'
                  }`}
                >
                  Private Chat
                </button>
                <button
                  type="button"
                  onClick={() => setCtaDestination('url')}
                  className={`px-2 py-0.5 rounded-lg transition ${
                    ctaDestination === 'url'
                      ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                      : 'text-slate-400'
                  }`}
                >
                  Custom Link
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Button text (e.g. Inquire on Chat)"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              {ctaDestination === 'url' ? (
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://example.com/item"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              ) : (
                <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center">
                  Opens instant E2EE chat with you
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Broadcasting to Contacts...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Publish Advertisement to All Contacts</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
