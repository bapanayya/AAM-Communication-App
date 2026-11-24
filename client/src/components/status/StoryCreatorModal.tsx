import React, { useState } from 'react';
import { X, Type, Image as ImageIcon, Send, Palette } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';

interface StoryCreatorModalProps {
  onClose: () => void;
}

const GRADIENTS = [
  { id: 'g1', name: 'Saffron Aura', class: 'from-amber-600 via-orange-600 to-rose-700' },
  { id: 'g2', name: 'Sovereign Bharat', class: 'from-orange-600 via-amber-500 to-emerald-600' },
  { id: 'g3', name: 'Deep Space', class: 'from-purple-900 via-indigo-900 to-slate-950' },
  { id: 'g4', name: 'Emerald Forest', class: 'from-emerald-700 via-teal-800 to-slate-900' },
];

export const StoryCreatorModal: React.FC<StoryCreatorModalProps> = ({ onClose }) => {
  const { createStatus } = useSocial();
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [textContent, setTextContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].class);
  const [privacy, setPrivacy] = useState<'all_contacts' | 'selected_contacts'>('all_contacts');

  const handleSubmit = async () => {
    if (mode === 'text' && !textContent.trim()) return;
    if (mode === 'image' && !mediaUrl.trim()) return;

    await createStatus({
      mediaType: mode,
      textContent: textContent.trim(),
      mediaUrl: mode === 'image' ? mediaUrl.trim() : undefined,
      backgroundGradient: selectedGradient,
      privacy,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-100">Create 24h Status</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setMode('text')}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              mode === 'text' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text Status</span>
          </button>
          <button
            onClick={() => setMode('image')}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
              mode === 'image' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo Status</span>
          </button>
        </div>

        {/* Content inputs */}
        {mode === 'text' ? (
          <div className="space-y-3">
            {/* Live Preview Box */}
            <div
              className={`w-full h-36 rounded-2xl p-4 flex items-center justify-center text-center font-bold text-sm text-white bg-gradient-to-tr ${selectedGradient} shadow-inner`}
            >
              <p className="line-clamp-4">{textContent || 'Type your message below...'}</p>
            </div>

            <textarea
              rows={3}
              placeholder="What's on your mind? (Disappears in 24 hours)"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />

            {/* Gradient Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Color Gradient</label>
              <div className="flex items-center space-x-2">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGradient(g.class)}
                    className={`w-7 h-7 rounded-full bg-gradient-to-tr ${g.class} ring-2 transition ${
                      selectedGradient === g.class ? 'ring-white scale-110' : 'ring-transparent opacity-80'
                    }`}
                    title={g.name}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Photo URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center space-x-1.5 mt-1 text-[10px] text-slate-500">
                <span>Presets:</span>
                <button
                  onClick={() =>
                    setMediaUrl(
                      'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80'
                    )
                  }
                  className="text-amber-400 underline hover:text-amber-300"
                >
                  Monsoon Vibes
                </button>
                <span>•</span>
                <button
                  onClick={() =>
                    setMediaUrl(
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
                    )
                  }
                  className="text-amber-400 underline hover:text-amber-300"
                >
                  Stargazing
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Caption (Optional)</label>
              <input
                type="text"
                placeholder="Add a caption..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* Privacy option */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Visible to:</span>
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="all_contacts">All Accepted Contacts</option>
            <option value="selected_contacts">Selected Contacts</option>
          </select>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Publish Story (24h)</span>
        </button>
      </div>
    </div>
  );
};
