import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Plus, Sparkles, Clock, Share2, Shield } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

interface DailyFeedReelsProps {
  onOpenChatWithUser: (userId: string) => void;
}

export const DailyFeedReels: React.FC<DailyFeedReelsProps> = ({ onOpenChatWithUser }) => {
  const { dailyFeedItems, likeFeedItem, reactFeedItem, createFeedMoment } = useSocial();
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [captionInput, setCaptionInput] = useState('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const handleCreatePost = async () => {
    if (!mediaUrlInput.trim()) return;
    await createFeedMoment(
      mediaUrlInput.trim(),
      mediaType,
      captionInput.trim()
    );
    setCaptionInput('');
    setMediaUrlInput('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden select-none relative">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Daily Moments Feed</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Today's Received Media
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Chronological feed from accepted contacts • Auto-archives to chat at midnight
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition shadow-md shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Post Moment</span>
        </button>
      </div>

      {/* Feed Stream */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center space-y-6">
        {dailyFeedItems.length === 0 ? (
          <div className="py-24 text-center text-slate-500 text-xs max-w-sm">
            <Sparkles className="w-10 h-10 mx-auto text-amber-500/40 mb-2" />
            <p className="font-semibold text-slate-300">No moments received today</p>
            <p className="mt-1">
              Photos and videos sent to you by accepted contacts appear here in your daily feed and automatically archive to chat at midnight.
            </p>
          </div>
        ) : (
          dailyFeedItems.map((item) => {
            const isLiked = item.likes.includes(user?.id || '');

            return (
              <div
                key={item.id}
                className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              >
                {/* Author Info */}
                <div className="p-3.5 flex items-center justify-between border-b border-slate-800/60">
                  <div
                    onClick={() => onOpenChatWithUser(item.senderId)}
                    className="flex items-center space-x-2.5 cursor-pointer group"
                  >
                    <img
                      src={
                        item.senderAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={item.senderName}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-500/40 group-hover:scale-105 transition"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition">
                        {item.senderName}
                      </h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Today • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Received Moment
                  </span>
                </div>

                {/* Media Presentation */}
                <div className="w-full aspect-square bg-black relative flex items-center justify-center overflow-hidden">
                  {item.mediaType === 'video' ? (
                    <video
                      src={item.mediaUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img src={item.mediaUrl} alt="Feed content" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Like */}
                      <button
                        onClick={() => likeFeedItem(item.id)}
                        className={`flex items-center space-x-1 text-xs font-semibold transition ${
                          isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500' : ''}`} />
                        <span>{item.likes.length}</span>
                      </button>

                      {/* Reply in Private Chat */}
                      <button
                        onClick={() => onOpenChatWithUser(item.senderId)}
                        className="flex items-center space-x-1 text-xs text-slate-400 hover:text-amber-400 transition"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>Reply in Chat</span>
                      </button>
                    </div>

                    {/* Quick Reactions */}
                    <div className="flex items-center space-x-1">
                      {['❤️', '🔥', '👏', '🙏'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => reactFeedItem(item.id, emoji)}
                          className="p-1 hover:scale-125 transition text-xs"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Caption */}
                  {item.caption && (
                    <p className="text-xs text-slate-200 leading-relaxed pt-1">
                      <strong className="text-amber-400 mr-1.5">{item.senderName}</strong>
                      {item.caption}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Post Moment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 mb-3">Post Today's Moment</h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Media Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMediaType('image')}
                    className={`py-1.5 rounded-xl text-xs font-semibold transition ${
                      mediaType === 'image'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    📷 Photo
                  </button>
                  <button
                    onClick={() => setMediaType('video')}
                    className={`py-1.5 rounded-xl text-xs font-semibold transition ${
                      mediaType === 'video'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    🎥 Video
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Media URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <div className="flex items-center space-x-1.5 mt-1.5 text-[10px] text-slate-500">
                  <span>Presets:</span>
                  <button
                    onClick={() =>
                      setMediaUrlInput(
                        'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80'
                      )
                    }
                    className="text-amber-400 underline hover:text-amber-300"
                  >
                    Agra Fort
                  </button>
                  <span>•</span>
                  <button
                    onClick={() =>
                      setMediaUrlInput(
                        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                      )
                    }
                    className="text-amber-400 underline hover:text-amber-300"
                  >
                    Sample Video
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Caption</label>
                <textarea
                  rows={2}
                  placeholder="Add a caption..."
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!mediaUrlInput.trim()}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs transition disabled:opacity-40"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
