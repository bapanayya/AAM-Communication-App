import React, { useState } from 'react';
import { Radio, X, Check, Send } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useChat } from '../../context/ChatContext';
import { api } from '../../services/api';

interface BroadcastModalProps {
  onClose: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ onClose }) => {
  const { contacts } = useSocial();
  const { loadConversations } = useChat();
  const [messageText, setMessageText] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!messageText.trim() || selectedContactIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await api.sendBroadcast(selectedContactIds, messageText.trim());
      await loadConversations();
      onClose();
    } catch (err) {
      console.error('Failed to send broadcast:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Broadcast Announcement</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mb-3">
          Broadcast sends individual encrypted 1:1 messages to recipients without creating a group. Recipients cannot see each other.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Select Recipients ({selectedContactIds.length})
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-800 rounded-xl p-2 bg-slate-950/60">
              {contacts.map((c) => {
                const isSelected = selectedContactIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleSelect(c.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                      isSelected ? 'bg-orange-500/20 text-orange-300' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{c.displayName}</span>
                    {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Broadcast Message</label>
            <textarea
              rows={3}
              placeholder="Type announcement..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!messageText.trim() || selectedContactIds.length === 0 || isSubmitting}
            className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-xs transition disabled:opacity-40 flex items-center justify-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Sending...' : 'Send Broadcast'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
