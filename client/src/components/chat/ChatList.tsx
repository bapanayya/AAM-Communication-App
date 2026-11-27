import React, { useState } from 'react';
import { Search, Plus, Users, Radio, Check, CheckCheck, Clock, ShieldCheck, MessageSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocial } from '../../context/SocialContext';
import { Conversation } from '../../types';

interface ChatListProps {
  onOpenNewGroup: () => void;
  onOpenBroadcast: () => void;
  onOpenNewChat: () => void;
  onOpenStatusViewer: (groupIndex: number) => void;
  onOpenStatusCreator: () => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  onOpenNewGroup,
  onOpenBroadcast,
  onOpenNewChat,
  onOpenStatusViewer,
  onOpenStatusCreator,
}) => {
  const { conversations, activeConversation, setActiveConversation } = useChat();
  const { user, onlineUserIds } = useAuth();
  const { statusGroups } = useSocial();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = (conversations || []).filter((c) => {
    const q = searchQuery.toLowerCase();
    const title = (c.title || c.name || '').toLowerCase();
    const lastMsgText = (c.lastMessage?.text || '').toLowerCase();
    return title.includes(q) || lastMsgText.includes(q);
  });

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderDeliveryIcon = (msg?: any) => {
    if (!msg || msg.senderId !== user?.id) return null;
    switch (msg.deliveryState) {
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-blue-400 inline mr-1" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline mr-1" />;
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-slate-400 inline mr-1" />;
      case 'pending':
      default:
        return (
          <span title="Queued locally (recipient offline)">
            <Clock className="w-3 h-3 text-amber-400 inline mr-1" />
          </span>
        );
    }
  };

  return (
    <div className="w-full sm:w-80 md:w-96 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Header & Quick Action Buttons */}
      <div className="p-3 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
            <span>Conversations</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {conversations.length}
            </span>
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={onOpenNewChat}
              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition"
              title="Start New Direct Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenNewGroup}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Create New Group"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenBroadcast}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Send Broadcast Message"
            >
              <Radio className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search chats, contacts, messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/70 transition"
          />
        </div>
      </div>

      {/* Stories / 24h Status Carousel */}
      <div className="px-3 py-2 border-b border-slate-800/80 overflow-x-auto flex items-center space-x-3 scrollbar-none">
        {/* Add own story */}
        <div
          onClick={onOpenStatusCreator}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
        >
          <div className="relative w-12 h-12 rounded-full p-0.5 border border-dashed border-amber-500/80 flex items-center justify-center bg-slate-800 transition group-hover:scale-105">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt="My Status"
              className="w-full h-full rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-0.5 ring-2 ring-slate-900">
              <Plus className="w-3 h-3 font-bold" />
            </div>
          </div>
          <span className="text-[10px] text-slate-300 mt-1 font-medium truncate max-w-[56px]">Your Story</span>
        </div>

        {/* Other users' stories */}
        {statusGroups.map((group, idx) => {
          if (group.user.id === user?.id) return null;
          return (
            <div
              key={group.user.id}
              onClick={() => onOpenStatusViewer(idx)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              <div className="relative w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 transition group-hover:scale-105 shadow-sm">
                <img
                  src={group.user.avatar || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80'}
                  alt={group.user.displayName}
                  className="w-full h-full rounded-full object-cover ring-2 ring-slate-900"
                />
              </div>
              <span className="text-[10px] text-slate-300 mt-1 truncate max-w-[56px]">
                {group.user.displayName.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <MessageSquare className="w-6 h-6 text-amber-400" />
            </div>
            {searchQuery ? (
              <div>
                <p className="font-semibold text-slate-300">No active chats matching "{searchQuery}"</p>
                <p className="mt-1 text-slate-500 text-[11px]">Search all registered contacts on AAM to start a chat or call!</p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-slate-300">No conversations yet</p>
                <p className="mt-1 text-slate-500 text-[11px]">Find registered contacts or start a conversation!</p>
              </div>
            )}
            <button
              onClick={onOpenNewChat}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              🔍 Find Registered Contacts
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConversation?.id === conv.id;
            const otherUserId = conv.otherUser?.id;
            const isOnline = otherUserId ? onlineUserIds.includes(otherUserId) : false;

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={`p-3 flex items-center space-x-3 cursor-pointer transition select-none ${
                  isSelected ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'hover:bg-slate-800/50'
                }`}
              >
                {/* Avatar with live presence indicator */}
                <div className="relative flex-shrink-0">
                  <img
                    src={conv.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={conv.title}
                    className="w-11 h-11 rounded-full object-cover border border-slate-700"
                  />
                  {conv.type === 'direct' && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  )}
                  {conv.type === 'group' && (
                    <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-0.5 border border-slate-700 text-[9px] text-amber-400">
                      👥
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-200 truncate">{conv.title}</h3>
                    <span className="text-[10px] text-slate-500 flex-shrink-0 ml-1">
                      {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-slate-400 truncate flex items-center pr-2">
                      {renderDeliveryIcon(conv.lastMessage)}
                      <span>
                        {conv.lastMessage?.isDeleted
                          ? 'This message was deleted'
                          : conv.lastMessage?.text ||
                            (conv.lastMessage?.contentType === 'image' && '📷 Photo') ||
                            (conv.lastMessage?.contentType === 'video' && '🎥 Video') ||
                            (conv.lastMessage?.contentType === 'audio' && '🎤 Voice note') ||
                            'Start a private conversation'}
                      </span>
                    </p>

                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className="bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
