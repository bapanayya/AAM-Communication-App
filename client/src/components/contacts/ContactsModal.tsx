import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  MessageSquare,
  Phone,
  Video,
  ShieldAlert,
  HardDrive,
} from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { api } from '../../services/api';

interface ContactsModalProps {
  onClose: () => void;
  onOpenDirectChat: (userId: string) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({ onClose, onOpenDirectChat }) => {
  const { contacts, friendRequests, acceptFriendRequest, rejectFriendRequest, sendFriendRequest } = useSocial();
  const { user, onlineUserIds } = useAuth();
  const { startCall } = useCall();

  const [activeTab, setActiveTab] = useState<'contacts' | 'requests' | 'search'>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestSentMap, setRequestSentMap] = useState<Record<string, boolean>>({});

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.searchUsers(searchQuery.trim());
      setSearchResults(res.users);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    try {
      await sendFriendRequest(targetId);
      setRequestSentMap((prev) => ({ ...prev, [targetId]: true }));
    } catch (err) {
      console.error('Request error:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">AAM Contacts & Network</h2>
              <p className="text-[11px] text-slate-400">Accepted relationships & friend requests</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 text-xs">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-2.5 font-semibold transition border-b-2 ${
              activeTab === 'contacts'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2.5 font-semibold transition border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'requests'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Requests</span>
            {friendRequests.incoming.length > 0 && (
              <span className="bg-rose-500 text-white rounded-full text-[9px] px-1.5 py-0.2 font-bold">
                {friendRequests.incoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-2.5 font-semibold transition border-b-2 ${
              activeTab === 'search'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Find People
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Contacts List */}
          {activeTab === 'contacts' && (
            <div className="space-y-2">
              {contacts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  <p>No contacts yet.</p>
                  <p className="mt-1">Search and connect with friends to chat and call!</p>
                </div>
              ) : (
                contacts.map((c) => {
                  const isOnline = onlineUserIds.includes(c.id);

                  return (
                    <div
                      key={c.id}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between transition hover:border-slate-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={
                              c.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                            }
                            alt={c.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-slate-600"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                              isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100">{c.displayName}</h4>
                          <p className="text-[10px] text-slate-400">@{c.username}</p>
                          <span className="inline-block text-[9px] text-amber-400/90 font-medium">
                            {c.storageMode === 'cloud_sync' ? '⚡ Cloud Sync' : '🔒 Local Store'}
                          </span>
                        </div>
                      </div>

                      {/* Contact Shortcuts */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            onOpenDirectChat(c.id);
                            onClose();
                          }}
                          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-amber-400 transition"
                          title="Message"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            startCall({
                              type: 'audio',
                              recipientId: c.id,
                              recipientName: c.displayName,
                              recipientAvatar: c.avatar,
                            });
                            onClose();
                          }}
                          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-amber-400 transition"
                          title="Audio Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            startCall({
                              type: 'video',
                              recipientId: c.id,
                              recipientName: c.displayName,
                              recipientAvatar: c.avatar,
                            });
                            onClose();
                          }}
                          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-amber-400 transition"
                          title="Video Call"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Friend Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300">
                Incoming Requests ({friendRequests.incoming.length})
              </h4>
              {friendRequests.incoming.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No incoming requests.</p>
              ) : (
                friendRequests.incoming.map((req) => (
                  <div
                    key={req.id}
                    className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          req.sender?.avatar ||
                          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
                        }
                        alt="Sender"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{req.sender?.displayName}</h4>
                        <p className="text-[10px] text-slate-400">@{req.sender?.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => acceptFriendRequest(req.id)}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition"
                        title="Accept Request"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectFriendRequest(req.id)}
                        className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-rose-400 transition"
                        title="Reject Request"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Find People Search */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search by username, phone (+91...), or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition disabled:opacity-40"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>

              {searchResults.map((sr) => (
                <div
                  key={sr.id}
                  className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        sr.avatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={sr.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{sr.displayName}</h4>
                      <p className="text-[10px] text-slate-400">@{sr.username}</p>
                    </div>
                  </div>

                  {requestSentMap[sr.id] ? (
                    <span className="text-emerald-400 text-[11px] font-semibold">Request Sent</span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(sr.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
