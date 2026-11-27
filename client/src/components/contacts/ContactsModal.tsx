import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  MessageSquare,
  Phone,
  Video,
  Clock,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { api } from '../../services/api';

interface ContactsModalProps {
  onClose: () => void;
  onOpenDirectChat: (userId: string) => void;
  initialTab?: 'search' | 'contacts' | 'requests';
  initialQuery?: string;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  onClose,
  onOpenDirectChat,
  initialTab = 'search',
  initialQuery = '',
}) => {
  const {
    contacts,
    friendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    sendFriendRequest,
    loadContacts,
    loadFriendRequests,
  } = useSocial();
  const { user, onlineUserIds } = useAuth();
  const { startCall } = useCall();

  const [activeTab, setActiveTab] = useState<'search' | 'contacts' | 'requests'>(
    contacts.length === 0 ? 'search' : initialTab
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<Record<string, boolean>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'online' | 'new'>('all');

  // Fetch registered users from backend on mount
  const fetchRegisteredUsers = async (query = '') => {
    setIsLoadingUsers(true);
    try {
      const res = await api.searchUsers(query);
      setRegisteredUsers(res.users || []);
    } catch (err) {
      console.error('Error fetching registered users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchRegisteredUsers(searchQuery);
  }, []);

  // Handle live search as user types
  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    fetchRegisteredUsers(val.trim());
  };

  const handleSendFriendRequest = async (targetId: string) => {
    setSendingRequestTo((prev) => ({ ...prev, [targetId]: true }));
    try {
      await sendFriendRequest(targetId);
      await fetchRegisteredUsers(searchQuery);
    } catch (err) {
      console.error('Send friend request error:', err);
    } finally {
      setSendingRequestTo((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelFriendRequest(requestId);
      await fetchRegisteredUsers(searchQuery);
    } catch (err) {
      console.error('Cancel request error:', err);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      await fetchRegisteredUsers(searchQuery);
    } catch (err) {
      console.error('Accept request error:', err);
    }
  };

  // Filtered registered users
  const displayedUsers = useMemo(() => {
    return registeredUsers.filter((u) => {
      if (filterMode === 'online') {
        return onlineUserIds.includes(u.id);
      }
      if (filterMode === 'new') {
        return !u.isFriend && u.friendRequestStatus === 'none';
      }
      return true;
    });
  }, [registeredUsers, filterMode, onlineUserIds]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        (c.displayName || '').toLowerCase().includes(q) ||
        (c.username || '').toLowerCase().includes(q) ||
        (c.phoneNumber && c.phoneNumber.includes(q))
    );
  }, [contacts, searchQuery]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-slate-800">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>AAM Contacts & Friends</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Live
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Connect, chat, call & add sovereign contacts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/70 text-xs">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-3 font-semibold transition border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'search'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Find People</span>
            {registeredUsers.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {registeredUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-3 font-semibold transition border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'contacts'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>My Friends</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {contacts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 font-semibold transition border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'requests'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Requests</span>
            {friendRequests.incoming.length > 0 ? (
              <span className="bg-rose-500 text-white rounded-full text-[9px] px-1.5 py-0.2 font-bold animate-pulse">
                {friendRequests.incoming.length}
              </span>
            ) : null}
          </button>
        </div>

        {/* Tab 1: Find Registered People & Network */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-hidden flex flex-col p-4 space-y-3">
            {/* Search Input Bar */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search registered users by name, @username, phone, or email..."
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              {isLoadingUsers ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin absolute right-3" />
              ) : searchQuery ? (
                <button
                  onClick={() => handleQueryChange('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Quick Filters */}
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-slate-500 text-[10px] font-semibold mr-1">FILTER:</span>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterMode === 'all'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Registered ({registeredUsers.length})
              </button>
              <button
                onClick={() => setFilterMode('online')}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center space-x-1 ${
                  filterMode === 'online'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online Now</span>
              </button>
              <button
                onClick={() => setFilterMode('new')}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterMode === 'new'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                New Friends
              </button>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 divide-y divide-slate-800/40">
              {isLoadingUsers && registeredUsers.length === 0 ? (
                <div className="py-14 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="font-semibold text-slate-200">Loading registered users from Oracle Cloud...</p>
                  <p className="text-[11px] text-slate-500">Connecting to live cloud network</p>
                </div>
              ) : displayedUsers.length === 0 ? (
                <div className="py-14 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
                  <Users className="w-10 h-10 text-slate-700" />
                  <p className="font-semibold text-slate-300">
                    {searchQuery ? `No users matching "${searchQuery}"` : 'No other users registered yet'}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    {searchQuery
                      ? 'Try searching with a partial username or mobile number.'
                      : 'Ask other team members to register on their devices to start chatting & calling!'}
                  </p>
                  <button
                    onClick={() => fetchRegisteredUsers('')}
                    className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh List</span>
                  </button>
                </div>
              ) : (
                displayedUsers.map((u) => {
                  const isOnline = onlineUserIds.includes(u.id);
                  const isFriend = u.isFriend;
                  const reqStatus = u.friendRequestStatus; // 'incoming' | 'outgoing' | 'none'
                  const isSendingThis = sendingRequestTo[u.id];

                  return (
                    <div
                      key={u.id}
                      className="pt-2 pb-1 bg-slate-900/60 hover:bg-slate-800/40 rounded-2xl p-2.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border border-transparent hover:border-slate-800"
                    >
                      {/* User Info */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              u.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                            }
                            alt={u.displayName}
                            className="w-11 h-11 rounded-full object-cover border border-slate-700 shadow-sm"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                              isOnline ? 'bg-emerald-500' : 'bg-slate-600'
                            }`}
                            title={isOnline ? 'Online' : 'Offline'}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="text-xs font-bold text-slate-100 truncate">{u.displayName}</h4>
                            {u.isSelf && (
                              <span className="flex-shrink-0 text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                                You
                              </span>
                            )}
                            {isFriend && (
                              <span className="flex-shrink-0 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                Friend
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">@{u.username}</p>
                          {u.phoneNumber && (
                            <p className="text-[10px] text-amber-400/80 font-mono truncate">{u.phoneNumber}</p>
                          )}
                          <span className="inline-block text-[9px] text-slate-500">
                            {u.storageMode === 'cloud_sync' ? '⚡ Cloud Sync' : '🔒 Sovereign Store'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0 justify-end">
                        {u.isSelf ? (
                          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                            You (Your Account)
                          </span>
                        ) : (
                          <>
                            {/* 1. Direct Message */}
                            <button
                              onClick={() => {
                                onOpenDirectChat(u.id);
                                onClose();
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                              title="Start Chat"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Chat</span>
                            </button>

                            {/* 2. Audio Call */}
                            <button
                              onClick={() => {
                                startCall({
                                  type: 'audio',
                                  recipientId: u.id,
                                  recipientName: u.displayName,
                                  recipientAvatar: u.avatar,
                                });
                                onClose();
                              }}
                              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 transition flex items-center space-x-1"
                              title="Audio Call"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden sm:inline text-xs">Call</span>
                            </button>

                            {/* 3. Video Call */}
                            <button
                              onClick={() => {
                                startCall({
                                  type: 'video',
                                  recipientId: u.id,
                                  recipientName: u.displayName,
                                  recipientAvatar: u.avatar,
                                });
                                onClose();
                              }}
                              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-blue-400 transition flex items-center space-x-1"
                              title="Video Call"
                            >
                              <Video className="w-3.5 h-3.5 text-blue-400" />
                              <span className="hidden sm:inline text-xs">Video</span>
                            </button>

                            {/* 4. Friend Status Button */}
                            {isFriend ? (
                              <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs flex items-center" title="Already in your Contacts">
                                <UserCheck className="w-3.5 h-3.5" />
                              </div>
                            ) : reqStatus === 'outgoing' ? (
                              <button
                                onClick={() => u.friendRequestId && handleCancelRequest(u.friendRequestId)}
                                className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-[10px] font-medium transition flex items-center space-x-1"
                                title="Click to cancel outgoing request"
                              >
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Pending</span>
                              </button>
                            ) : reqStatus === 'incoming' ? (
                              <button
                                onClick={() => u.friendRequestId && handleAcceptRequest(u.friendRequestId)}
                                className="px-2 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition flex items-center space-x-1"
                                title="Accept incoming request"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendFriendRequest(u.id)}
                                disabled={isSendingThis}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-xs font-semibold transition flex items-center space-x-1 disabled:opacity-40"
                                title="Send Friend Request"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Add</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Accepted Friends */}
        {activeTab === 'contacts' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredContacts.length === 0 ? (
              <div className="py-14 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
                <Users className="w-10 h-10 text-slate-700" />
                <p className="font-semibold text-slate-300">No contacts in your network yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Discover team members and fellow users registered on AAM to start private sovereign chats and calls.
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  Browse Registered Users ({registeredUsers.length})
                </button>
              </div>
            ) : (
              filteredContacts.map((c) => {
                const isOnline = onlineUserIds.includes(c.id);

                return (
                  <div
                    key={c.id}
                    className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between transition hover:border-slate-600"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative flex-shrink-0">
                        <img
                          src={
                            c.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                          }
                          alt={c.displayName}
                          className="w-11 h-11 rounded-full object-cover border border-slate-600"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                            isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                          }`}
                          title={isOnline ? 'Online' : 'Offline'}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 truncate">{c.displayName}</h4>
                        <p className="text-[10px] text-slate-400 truncate">@{c.username}</p>
                        {c.phoneNumber && (
                          <p className="text-[10px] text-amber-400/80 font-mono truncate">{c.phoneNumber}</p>
                        )}
                        <span className="inline-block text-[9px] text-amber-400/90 font-medium">
                          {c.storageMode === 'cloud_sync' ? '⚡ Cloud Sync' : '🔒 Local Store'}
                        </span>
                      </div>
                    </div>

                    {/* Contact Action Shortcuts */}
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          onOpenDirectChat(c.id);
                          onClose();
                        }}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
                        title="Open Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Message</span>
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
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-emerald-400 transition flex items-center space-x-1.5"
                        title="Start Audio Call"
                      >
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <span className="hidden sm:inline text-xs">Call</span>
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
                        className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-blue-400 transition flex items-center space-x-1.5"
                        title="Start Video Call"
                      >
                        <Video className="w-4 h-4 text-blue-400" />
                        <span className="hidden sm:inline text-xs">Video</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 3: Friend Requests */}
        {activeTab === 'requests' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Incoming Requests */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <span>Incoming Requests</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px] border border-slate-700">
                  {friendRequests.incoming.length}
                </span>
              </h4>

              {friendRequests.incoming.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800/60">
                  No pending incoming requests.
                </div>
              ) : (
                <div className="space-y-2">
                  {friendRequests.incoming.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={
                            req.sender?.avatar ||
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
                          }
                          alt="Sender"
                          className="w-10 h-10 rounded-full object-cover border border-slate-600"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-100 truncate">{req.sender?.displayName}</h4>
                          <p className="text-[10px] text-slate-400 truncate">@{req.sender?.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-sm"
                          title="Accept Request"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => rejectFriendRequest(req.id)}
                          className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-rose-400 transition"
                          title="Decline Request"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            {friendRequests.outgoing && friendRequests.outgoing.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <span>Sent Requests (Pending)</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[10px] border border-slate-700">
                    {friendRequests.outgoing.length}
                  </span>
                </h4>
                <div className="space-y-2">
                  {friendRequests.outgoing.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={
                            req.recipient?.avatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                          }
                          alt="Recipient"
                          className="w-9 h-9 rounded-full object-cover border border-slate-700"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{req.recipient?.displayName}</h4>
                          <p className="text-[10px] text-slate-400 truncate">@{req.recipient?.username}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
