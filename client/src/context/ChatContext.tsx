import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Conversation, Message, PendingTransfer } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  pendingTransfers: PendingTransfer[];
  typingUsers: Record<string, string>; // conversationId -> typingUserName
  loadingConversations: boolean;
  loadingMessages: boolean;
  setActiveConversation: (conv: Conversation | null) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (convId: string) => Promise<void>;
  sendMessage: (payload: {
    contentType: 'text' | 'image' | 'video' | 'audio' | 'mixed';
    text?: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    mediaDuration?: number;
  }) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  starMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string, deleteForEveryone?: boolean) => Promise<void>;
  loadPendingTransfers: () => Promise<void>;
  retryTransfer: (id: string) => Promise<void>;
  cancelTransfer: (id: string) => Promise<void>;
  startDirectChat: (contactUserId: string) => Promise<Conversation>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, onlineUserIds } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [loadingConversations, setLoadingConversations] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingConversations(true);
      const res = await api.getConversations();
      setConversations(res.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await api.getMessages(convId);
      setMessages(res.messages);

      // Auto-acknowledge unread messages as read
      res.messages.forEach((m: Message) => {
        if (m.recipientId === user?.id && m.deliveryState !== 'read') {
          api.ackMessage(m.id, 'read');
          socket.send('message.read', { messageId: m.id, senderId: m.senderId });
        }
      });
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [user]);

  const loadPendingTransfers = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.getPendingTransfers();
      setPendingTransfers(res.transfers);
    } catch (err) {
      console.error('Failed to load pending transfers:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadPendingTransfers();
    }
  }, [user, loadConversations, loadPendingTransfers]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    } else {
      setMessages([]);
    }
  }, [activeConversation, loadMessages]);

  // WebSocket event subscriptions
  useEffect(() => {
    const unsubNewMsg = socket.on('message.new', (data: { message: Message }) => {
      const msg = data.message;
      setMessages((prev) => {
        if (activeConversation && msg.conversationId === activeConversation.id) {
          if (!prev.some((m) => m.id === msg.id)) {
            // Acknowledge read if active
            api.ackMessage(msg.id, 'read');
            socket.send('message.read', { messageId: msg.id, senderId: msg.senderId });
            return [...prev, { ...msg, deliveryState: 'read' }];
          }
        }
        return prev;
      });

      // Update conversation list last message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === msg.conversationId
            ? { ...c, lastMessage: msg, unreadCount: activeConversation?.id === c.id ? 0 : (c.unreadCount || 0) + 1 }
            : c
        )
      );
    });

    const unsubRead = socket.on('message.read', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId ? { ...m, deliveryState: 'read' } : m))
      );
    });

    const unsubDelivered = socket.on('message.delivered', (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.messageId && m.deliveryState !== 'read' ? { ...m, deliveryState: 'delivered' } : m))
      );
    });

    const unsubRecipientOnline = socket.on('transfer.recipient_online', async (data: { transferId: string; messageId: string }) => {
      console.log('Recipient is now online! Auto-delivering pending transfer', data);
      await loadPendingTransfers();
      await loadConversations();
      if (activeConversation) {
        await loadMessages(activeConversation.id);
      }
    });

    const unsubTypingStart = socket.on('typing.start', (data: { senderId: string; conversationId: string }) => {
      setTypingUsers((prev) => ({ ...prev, [data.conversationId]: 'Typing...' }));
    });

    const unsubTypingStop = socket.on('typing.stop', (data: { conversationId: string }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[data.conversationId];
        return next;
      });
    });

    return () => {
      unsubNewMsg();
      unsubRead();
      unsubDelivered();
      unsubRecipientOnline();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [activeConversation, loadConversations, loadMessages, loadPendingTransfers]);

  const sendMessage = async (payload: {
    contentType: 'text' | 'image' | 'video' | 'audio' | 'mixed';
    text?: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    mediaDuration?: number;
  }) => {
    if (!activeConversation || !user) return;

    const otherMemberId = activeConversation.type === 'direct'
      ? activeConversation.memberIds.find((id) => id !== user.id)
      : undefined;

    const isRecipientOnline = otherMemberId ? onlineUserIds.includes(otherMemberId) : true;

    const res = await api.sendMessage(activeConversation.id, {
      ...payload,
      isRecipientOnline,
    });

    const sentMsg = res.message;
    setMessages((prev) => [...prev, sentMsg]);

    // Broadcast over WebSocket
    socket.send('message.send', {
      message: sentMsg,
      conversationId: activeConversation.id,
      recipientId: otherMemberId,
    });

    // Refresh conversations & pending transfers
    loadConversations();
    loadPendingTransfers();
  };

  const sendTyping = (isTyping: boolean) => {
    if (!activeConversation || !user) return;
    const otherMemberId = activeConversation.type === 'direct'
      ? activeConversation.memberIds.find((id) => id !== user.id)
      : undefined;

    socket.send(isTyping ? 'typing.start' : 'typing.stop', {
      conversationId: activeConversation.id,
      recipientId: otherMemberId,
    });
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    const res = await api.reactToMessage(messageId, emoji);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? res.message : m)));
  };

  const starMessage = async (messageId: string) => {
    const res = await api.starMessage(messageId);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isStarred: res.isStarred } : m)));
  };

  const deleteMessage = async (messageId: string, deleteForEveryone = false) => {
    await api.deleteMessage(messageId, deleteForEveryone);
    if (deleteForEveryone) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted', mediaUrl: undefined } : m
        )
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const retryTransfer = async (id: string) => {
    await api.retryPendingTransfer(id);
    await loadPendingTransfers();
  };

  const cancelTransfer = async (id: string) => {
    await api.cancelPendingTransfer(id);
    await loadPendingTransfers();
  };

  const startDirectChat = async (contactUserId: string): Promise<Conversation> => {
    const res = await api.getOrCreateDirectConversation(contactUserId);
    await loadConversations();
    setActiveConversation(res.conversation);
    return res.conversation;
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        pendingTransfers,
        typingUsers,
        loadingConversations,
        loadingMessages,
        setActiveConversation,
        loadConversations,
        loadMessages,
        sendMessage,
        sendTyping,
        reactToMessage,
        starMessage,
        deleteMessage,
        loadPendingTransfers,
        retryTransfer,
        cancelTransfer,
        startDirectChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
