import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Video,
  ShieldCheck,
  Send,
  Paperclip,
  Image as ImageIcon,
  Film,
  Mic,
  Square,
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Star,
  Trash2,
  Lock,
  ArrowLeft,
  X,
  Share2,
  HardDrive,
  Link2,
  ExternalLink,
  Info,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { CryptoEngine } from '../../crypto/e2ee';
import { Message, Conversation } from '../../types';

interface ChatWindowProps {
  onBack?: () => void;
  onOpenTransfers: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onBack, onOpenTransfers }) => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    sendMessage,
    sendTyping,
    reactToMessage,
    starMessage,
    deleteMessage,
    typingUsers,
    pendingTransfers,
    forwardMessage,
    getConnectedChats,
  } = useChat();
  const { user, onlineUserIds } = useAuth();
  const { startCall } = useCall();

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyFingerprint, setSafetyFingerprint] = useState('');
  const [selectedReactionMessageId, setSelectedReactionMessageId] = useState<string | null>(null);

  // Single-Instance Storage & Forwarding states
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [selectedForwardConvIds, setSelectedForwardConvIds] = useState<string[]>([]);
  const [forwardSearchQuery, setForwardSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [forwardToast, setForwardToast] = useState<string | null>(null);

  // Connected Media Inspection state
  const [inspectingMedia, setInspectingMedia] = useState<{
    message: Message;
    mediaRecord?: any;
    connectedChats?: any[];
    savedBytes?: number;
  } | null>(null);
  const [loadingConnectedChats, setLoadingConnectedChats] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recordingTimerRef = useRef<any>(null);

  const otherUserId = activeConversation?.type === 'direct'
    ? activeConversation.memberIds.find((id) => id !== user?.id)
    : undefined;

  const isRecipientOnline = otherUserId ? onlineUserIds.includes(otherUserId) : true;
  const isTyping = activeConversation ? !!typingUsers[activeConversation.id] : false;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load safety fingerprint
  useEffect(() => {
    if (user && otherUserId) {
      CryptoEngine.getSafetyFingerprint(user.id, otherUserId).then(setSafetyFingerprint);
    }
  }, [user, otherUserId]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    sendTyping(false);
    await sendMessage({
      contentType: 'text',
      text: textToSend,
    });
  };

  const handleSendMedia = async (type: 'image' | 'video') => {
    setShowAttachMenu(false);
    if (type === 'image') {
      await sendMessage({
        contentType: 'image',
        text: 'Shared photo via AAM Sovereign Storage',
        mediaUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80',
        mediaName: 'Photo_AUM_Capture.jpg',
        mediaSize: 1024 * 512,
      });
    } else {
      await sendMessage({
        contentType: 'video',
        text: 'Shared 1080p video clip',
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        mediaName: 'Video_Clip_1080p.mp4',
        mediaSize: 1024 * 1024 * 4.5,
        mediaDuration: 15,
      });
    }
  };

  const handleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop and send simulated voice note
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      sendMessage({
        contentType: 'audio',
        text: `Voice note (${recordingSeconds}s)`,
        mediaUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_morning.ogg',
        mediaDuration: recordingSeconds || 5,
        mediaSize: 1024 * 64,
      });
    }
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!activeConversation) return;
    if (activeConversation.type === 'direct' && otherUserId) {
      startCall({
        type,
        recipientId: otherUserId,
        recipientName: activeConversation.title,
        recipientAvatar: activeConversation.avatar,
        isGroup: false,
      });
    } else {
      startCall({
        type,
        isGroup: true,
        conversationId: activeConversation.id,
        recipientName: activeConversation.title,
        participantIds: activeConversation.memberIds,
      });
    }
  };

  const handleOpenForwardModal = (msg: Message) => {
    setForwardingMessage(msg);
    setSelectedForwardConvIds([]);
    setForwardSearchQuery('');
  };

  const handleToggleForwardTarget = (convId: string) => {
    setSelectedForwardConvIds((prev) =>
      prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
    );
  };

  const handleConfirmForward = async () => {
    if (!forwardingMessage || selectedForwardConvIds.length === 0) return;
    setIsForwarding(true);
    try {
      const result = await forwardMessage(forwardingMessage.id, selectedForwardConvIds);
      const savedKb = Math.round((result.savedBytes || 0) / 1024);
      setForwardToast(
        `Forwarded to ${result.forwardedCount} chats! Single-Instance Storage active: 0 MB duplicated, saved ~${savedKb} KB device storage.`
      );
      setTimeout(() => setForwardToast(null), 5000);
      setForwardingMessage(null);
      setSelectedForwardConvIds([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsForwarding(false);
    }
  };

  const handleInspectConnectedMedia = async (msg: Message) => {
    setInspectingMedia({ message: msg });
    if (msg.mediaHash) {
      setLoadingConnectedChats(true);
      try {
        const res = await getConnectedChats(msg.mediaHash);
        setInspectingMedia({
          message: msg,
          mediaRecord: res.mediaRecord,
          connectedChats: res.connectedConversations,
          savedBytes: res.savedBytes,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingConnectedChats(false);
      }
    }
  };

  const handleJumpToChat = (targetConvId: string) => {
    const target = conversations.find((c) => c.id === targetConvId);
    if (target) {
      setActiveConversation(target);
      setInspectingMedia(null);
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl mb-4 text-amber-400">
          🕉️
        </div>
        <h3 className="text-base font-semibold text-slate-200">AAM Private Messaging</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Select a conversation or start a new encrypted chat with an accepted contact. Content is protected with sovereign E2EE encryption.
        </p>
      </div>
    );
  }

  const isLocalMode = user?.storageMode === 'local_device';
  const showOfflineWarning = isLocalMode && !isRecipientOnline && activeConversation.type === 'direct';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Chat Top Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button onClick={onBack} className="sm:hidden p-1 text-slate-400 hover:text-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="relative">
            <img
              src={activeConversation.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={activeConversation.title}
              className="w-10 h-10 rounded-full object-cover border border-slate-700"
            />
            {activeConversation.type === 'direct' && (
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                  isRecipientOnline ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <span>{activeConversation.title}</span>
              {activeConversation.type === 'direct' && (
                <span title="E2EE Active">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
              {isTyping ? (
                <span className="text-amber-400 font-medium animate-pulse">Typing...</span>
              ) : activeConversation.type === 'direct' ? (
                <span>{isRecipientOnline ? 'Online now' : 'Offline (Peer Storage Active)'}</span>
              ) : (
                <span>{activeConversation.memberIds.length} members</span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Audio Call */}
          <button
            onClick={() => handleStartCall('audio')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition"
            title="Start Audio Call (WebRTC)"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video Call */}
          <button
            onClick={() => handleStartCall('video')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition"
            title="Start Video Call (WebRTC)"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* E2EE Safety Number Fingerprint */}
          <button
            onClick={() => setShowSafetyModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
            title="Verify Cryptographic Safety Number"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Offline Mode 1 Notice Banner */}
      {showOfflineWarning && (
        <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Recipient is offline:</strong> In Local Device Storage mode, messages remain stored on your device and will be transferred automatically when the recipient reconnects.
            </span>
          </div>
          <button
            onClick={onOpenTransfers}
            className="ml-3 text-[11px] underline font-semibold text-amber-300 hover:text-amber-100 flex-shrink-0"
          >
            View Transfers
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
            >
              <div
                className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 text-xs shadow-md transition ${
                  isMe
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-br-none'
                    : 'bg-slate-800/90 border border-slate-700/70 text-slate-100 rounded-bl-none'
                }`}
              >
                {/* Forwarded Header Info */}
                {msg.forwardedFrom && (
                  <div className="flex items-center space-x-1 text-[10px] opacity-80 italic mb-2 pb-1 border-b border-white/10">
                    <Share2 className="w-3 h-3 text-amber-300 flex-shrink-0" />
                    <span>Forwarded from <strong>{msg.forwardedFrom.senderName}</strong></span>
                  </div>
                )}

                {/* Media Image */}
                {msg.contentType === 'image' && msg.mediaUrl && (
                  <div
                    onClick={() => handleInspectConnectedMedia(msg)}
                    className="mb-2 rounded-xl overflow-hidden border border-black/20 cursor-pointer relative group/media"
                    title="Tap to inspect Single-Instance Storage and connected chats"
                  >
                    <img src={msg.mediaUrl} alt="Shared Photo" className="w-full max-h-60 object-cover group-hover/media:scale-[1.02] transition" />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] text-white flex items-center space-x-1 shadow">
                      <HardDrive className="w-2.5 h-2.5 text-emerald-400" />
                      <span>1 Device Copy</span>
                    </div>
                  </div>
                )}

                {/* Media Video */}
                {msg.contentType === 'video' && msg.mediaUrl && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-black/20 relative">
                    <video src={msg.mediaUrl} controls className="w-full max-h-60 rounded-xl" />
                    <div
                      onClick={() => handleInspectConnectedMedia(msg)}
                      className="mt-1 flex items-center justify-between text-[10px] text-slate-300 bg-black/40 px-2 py-1 rounded cursor-pointer hover:bg-black/60 transition"
                      title="Tap to inspect Single-Instance Storage"
                    >
                      <span className="flex items-center space-x-1">
                        <HardDrive className="w-3 h-3 text-emerald-400" />
                        <span>Single Instance: 1 Device Copy</span>
                      </span>
                      <span className="text-amber-400 underline text-[9px]">Inspect Connected</span>
                    </div>
                  </div>
                )}

                {/* Voice Note Audio */}
                {msg.contentType === 'audio' && (
                  <div className="flex items-center space-x-2 py-1">
                    <div className="w-8 h-8 rounded-full bg-slate-900/40 flex items-center justify-center">
                      <Mic className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 bg-slate-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-white/70 w-2/3" />
                      </div>
                      <span className="text-[10px] opacity-80 mt-0.5 block">
                        Voice Note ({msg.mediaDuration || 5}s)
                      </span>
                    </div>
                  </div>
                )}

                {/* Text Body */}
                {msg.text && (
                  <p className={`whitespace-pre-wrap leading-relaxed ${msg.isDeleted ? 'italic opacity-60' : ''}`}>
                    {msg.text}
                  </p>
                )}

                {/* Connected Chats & Single-Instance CAS Pill */}
                {msg.mediaHash && (
                  <button
                    onClick={() => handleInspectConnectedMedia(msg)}
                    className="mt-2 flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-black/25 hover:bg-black/40 border border-white/20 transition text-left w-fit shadow-sm"
                    title="Open Single-Instance Storage inspector & connected chats"
                  >
                    <Link2 className="w-3 h-3 text-amber-300 flex-shrink-0" />
                    <span>
                      {msg.connectedConversationCount && msg.connectedConversationCount > 1
                        ? `Connected in ${msg.connectedConversationCount} chats`
                        : 'Connected across chats'}
                    </span>
                    <span className="text-[9px] text-emerald-300 font-semibold">• 1 Copy</span>
                  </button>
                )}

                {/* Message Meta Info: Star, Time, Delivery ticks */}
                <div className="flex items-center justify-end space-x-1.5 mt-1 pt-0.5 text-[10px] opacity-80">
                  {msg.isStarred && <Star className="w-3 h-3 fill-amber-300 text-amber-300" />}
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                  {isMe && (
                    <span>
                      {msg.deliveryState === 'read' ? (
                        <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-blue-200 inline" /></span>
                      ) : msg.deliveryState === 'delivered' ? (
                        <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-white/80 inline" /></span>
                      ) : msg.deliveryState === 'sent' ? (
                        <span title="Sent to server"><Check className="w-3.5 h-3.5 text-white/70 inline" /></span>
                      ) : (
                        <span title="Queued locally (recipient offline)"><Clock className="w-3 h-3 text-amber-200 inline" /></span>
                      )}
                    </span>
                  )}
                </div>

                {/* Reactions badge */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="absolute -bottom-2 right-2 bg-slate-900 border border-slate-700 rounded-full px-1.5 py-0.5 text-[10px] flex items-center space-x-1 shadow-lg">
                    {Object.values(msg.reactions).map((emoji, i) => (
                      <span key={i}>{emoji}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Hover actions: Forward, React, Star, Delete */}
              <div className="hidden group-hover:flex items-center space-x-1 text-[11px] text-slate-400 mt-1 px-1">
                <button
                  onClick={() => handleOpenForwardModal(msg)}
                  className="hover:text-amber-400 p-1"
                  title="Forward (Single-Instance: 0 duplicate bytes)"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedReactionMessageId(selectedReactionMessageId === msg.id ? null : msg.id)}
                  className="hover:text-amber-400 p-1"
                  title="React with Emoji"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => starMessage(msg.id)} className="hover:text-amber-400 p-1" title="Star Message">
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteMessage(msg.id, isMe)} className="hover:text-rose-400 p-1" title="Delete Message">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Emoji Picker Popover */}
              {selectedReactionMessageId === msg.id && (
                <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 p-1 rounded-full shadow-2xl mt-1 z-30">
                  {['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        reactToMessage(msg.id, emoji);
                        setSelectedReactionMessageId(null);
                      }}
                      className="p-1 hover:scale-125 transition text-xs"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 relative z-20">
        {/* Attachment menu popup */}
        {showAttachMenu && (
          <div className="absolute bottom-16 left-4 bg-slate-850 border border-slate-700 rounded-2xl p-2 shadow-2xl flex items-center space-x-2 z-30">
            <button
              onClick={() => handleSendMedia('image')}
              className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 transition"
            >
              <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1">
                <ImageIcon className="w-4 h-4" />
              </div>
              <span>Photo</span>
            </button>
            <button
              onClick={() => handleSendMedia('video')}
              className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 transition"
            >
              <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1">
                <Film className="w-4 h-4" />
              </div>
              <span>Video</span>
            </button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* Attachment Toggle */}
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Text Input / Voice recorder status */}
          {isRecording ? (
            <div className="flex-1 bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-red-300 animate-pulse">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>Recording audio clip... ({recordingSeconds}s)</span>
              </div>
              <button onClick={handleVoiceRecord} className="text-red-400 font-bold hover:underline">
                Tap mic to send
              </button>
            </div>
          ) : (
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type an end-to-end encrypted message..."
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          )}

          {/* Voice recorder button */}
          <button
            onClick={handleVoiceRecord}
            className={`p-2 rounded-xl transition ${
              isRecording
                ? 'bg-red-500 text-white animate-bounce'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={isRecording ? 'Stop & Send Recording' : 'Hold/Tap to Record Voice Note'}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold transition disabled:opacity-40 shadow-md"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Safety Number / E2EE Key Verification Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setShowSafetyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-center font-bold text-slate-100 text-sm">Verify Safety Number</h3>
            <p className="text-[11px] text-slate-400 text-center mt-1">
              To verify that messages and calls with {activeConversation.title} are end-to-end encrypted with no eavesdropper, compare this safety number with their device:
            </p>
            <div className="my-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-center font-mono text-sm tracking-widest text-emerald-400 font-bold">
              {safetyFingerprint || '4820 9183 2049'}
            </div>
            <div className="text-[10px] text-slate-500 text-center">
              AAM Sovereign Cryptographic Layer • AES-GCM 256 / SHA-256
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification for Forwarding / CAS Actions */}
      {forwardToast && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-emerald-950/95 border border-emerald-500/80 text-emerald-100 px-4 py-2.5 rounded-2xl text-xs shadow-2xl z-50 flex items-center space-x-2.5 backdrop-blur-md animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{forwardToast}</span>
        </div>
      )}

      {/* Forward Modal (Multi-Contact Forwarding with CAS Deduplication) */}
      {forwardingMessage && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-5 shadow-2xl relative flex flex-col max-h-[85vh]">
            <button
              onClick={() => setForwardingMessage(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Forward Message</h3>
                <p className="text-[11px] text-slate-400">Select one or multiple chats to share</p>
              </div>
            </div>

            {/* Single-Instance Storage Guarantee Badge */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 mb-3 text-xs text-emerald-200">
              <div className="flex items-center space-x-2 font-semibold text-emerald-400 mb-0.5">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Single-Instance Storage Enabled</span>
              </div>
              <p className="text-[10px] text-emerald-300/80 leading-normal">
                Only <strong>1 copy</strong> of this media is saved on your device. Forwarding connects all recipient chats to this single file without consuming duplicate storage.
              </p>
            </div>

            {/* Message Preview snippet */}
            <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 text-xs mb-3 flex items-center space-x-3">
              {forwardingMessage.contentType === 'image' && forwardingMessage.mediaUrl && (
                <img
                  src={forwardingMessage.mediaUrl}
                  alt="Preview"
                  className="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-slate-700"
                />
              )}
              {forwardingMessage.contentType === 'video' && (
                <div className="w-11 h-11 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                  <Film className="w-5 h-5" />
                </div>
              )}
              {forwardingMessage.contentType === 'audio' && (
                <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-slate-200 truncate">
                  {forwardingMessage.mediaName || (forwardingMessage.contentType === 'text' ? forwardingMessage.text : 'Media Attachment')}
                </p>
                {forwardingMessage.text && forwardingMessage.contentType !== 'text' && (
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{forwardingMessage.text}</p>
                )}
                {forwardingMessage.mediaSize && (
                  <span className="text-[9px] text-slate-500">
                    {(forwardingMessage.mediaSize / 1024).toFixed(1)} KB • CAS Verified
                  </span>
                )}
              </div>
            </div>

            {/* Search filter input */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={forwardSearchQuery}
                onChange={(e) => setForwardSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Conversation selection list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-56">
              {conversations
                .filter((c) =>
                  forwardSearchQuery
                    ? c.title.toLowerCase().includes(forwardSearchQuery.toLowerCase())
                    : true
                )
                .map((conv) => {
                  const isSelected = selectedForwardConvIds.includes(conv.id);
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleToggleForwardTarget(conv.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer border transition ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-slate-100'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={conv.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={conv.title}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <p className="text-xs font-semibold">{conv.title}</p>
                          <p className="text-[10px] text-slate-500">
                            {conv.type === 'direct' ? 'Direct Contact' : `${conv.memberIds.length} members`}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-slate-950'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">
                {selectedForwardConvIds.length} {selectedForwardConvIds.length === 1 ? 'chat' : 'chats'} selected
              </span>

              <div className="flex space-x-2">
                <button
                  onClick={() => setForwardingMessage(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmForward}
                  disabled={selectedForwardConvIds.length === 0 || isForwarding}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-40"
                >
                  {isForwarding ? 'Forwarding...' : `Forward (${selectedForwardConvIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Media & Single-Instance Storage Inspector Modal */}
      {inspectingMedia && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setInspectingMedia(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Single-Instance Storage & Connected Chats</h3>
                <p className="text-[11px] text-slate-400">Content-Addressable Storage (CAS) Inspection</p>
              </div>
            </div>

            {/* Media Preview Box */}
            <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 mb-3 max-h-56 flex items-center justify-center relative">
              {inspectingMedia.message.contentType === 'image' && inspectingMedia.message.mediaUrl && (
                <img
                  src={inspectingMedia.message.mediaUrl}
                  alt="Full Media"
                  className="max-h-56 w-auto object-contain"
                />
              )}
              {inspectingMedia.message.contentType === 'video' && inspectingMedia.message.mediaUrl && (
                <video
                  src={inspectingMedia.message.mediaUrl}
                  controls
                  className="max-h-56 w-full object-contain"
                />
              )}
              {inspectingMedia.message.contentType === 'audio' && (
                <div className="py-6 px-4 flex items-center space-x-3 text-slate-200">
                  <Mic className="w-8 h-8 text-amber-400" />
                  <div>
                    <p className="font-semibold">{inspectingMedia.message.mediaName || 'Voice Note'}</p>
                    <p className="text-xs text-slate-400">{inspectingMedia.message.mediaDuration || 5} seconds duration</p>
                  </div>
                </div>
              )}
            </div>

            {/* Storage Proof Specs */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-0.5">Physical Copies on Device</span>
                <span className="font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Exactly 1 Copy (Single-Instance)</span>
                </span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-400 block mb-0.5">Storage Deduplication Savings</span>
                <span className="font-bold text-amber-400">
                  {inspectingMedia.savedBytes && inspectingMedia.savedBytes > 0
                    ? `${(inspectingMedia.savedBytes / 1024).toFixed(1)} KB saved`
                    : 'Zero Redundancy'}
                </span>
              </div>
            </div>

            {/* CAS Fingerprint hash */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mb-3">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Cryptographic Content Hash (CAS SHA-256)</span>
                <span className="text-emerald-400 font-mono">Deduplicated</span>
              </div>
              <p className="font-mono text-[11px] text-amber-300 break-all select-all">
                {inspectingMedia.message.mediaHash || 'cas_sha256_mock_dedup'}
              </p>
            </div>

            {/* Connected Chats List */}
            <div className="flex-1 overflow-y-auto mb-2">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>Connected Conversations ({inspectingMedia.connectedChats?.length || 1})</span>
                <span className="text-[10px] font-normal text-slate-400">Accessible from any chat below:</span>
              </h4>

              {loadingConnectedChats ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading connected chats...</div>
              ) : (
                <div className="space-y-1.5">
                  {(inspectingMedia.connectedChats && inspectingMedia.connectedChats.length > 0
                    ? inspectingMedia.connectedChats
                    : [
                        {
                          id: activeConversation.id,
                          title: activeConversation.title,
                          avatar: activeConversation.avatar,
                          type: activeConversation.type,
                          messageCount: 1,
                        },
                      ]
                  ).map((chat: any) => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={chat.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={chat.title}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{chat.title}</p>
                          <p className="text-[10px] text-slate-500">
                            {chat.id === activeConversation.id ? 'Currently open chat' : 'Connected via single instance'}
                          </p>
                        </div>
                      </div>

                      {chat.id !== activeConversation.id ? (
                        <button
                          onClick={() => handleJumpToChat(chat.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center space-x-1 transition"
                        >
                          <span>Open in Chat</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          Active Chat
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 text-right">
              <button
                onClick={() => setInspectingMedia(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
