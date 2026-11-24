import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Message, PendingTransfer, MessageContentType, Conversation } from '../types';

export const messageRouter = Router();

// Get all conversations for current user
messageRouter.get('/conversations', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const allUsers = db.getUsers();
  const allMessages = db.getMessages();

  const userConversations = db
    .getConversations()
    .filter((c) => c.memberIds.includes(currentUserId))
    .map((c) => {
      // Find other member for direct chats
      const otherMemberId = c.memberIds.find((id) => id !== currentUserId);
      const otherUser = otherMemberId ? allUsers.find((u) => u.id === otherMemberId) : null;

      // Find last message
      const convMessages = allMessages
        .filter((m) => m.conversationId === c.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lastMessage = convMessages[0];

      // Unread count
      const unreadCount = allMessages.filter(
        (m) => m.conversationId === c.id && m.senderId !== currentUserId && m.deliveryState !== 'read'
      ).length;

      return {
        ...c,
        title: c.type === 'direct' ? otherUser?.displayName || 'Direct Chat' : c.name || 'Group Chat',
        avatar: c.type === 'direct' ? otherUser?.avatar : c.avatar,
        otherUser: otherUser
          ? {
              id: otherUser.id,
              username: otherUser.username,
              displayName: otherUser.displayName,
              avatar: otherUser.avatar,
              storageMode: otherUser.storageMode,
            }
          : null,
        lastMessage,
        unreadCount,
      };
    })
    .sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

  res.json({ conversations: userConversations });
});

// Get or create direct conversation with contact
messageRouter.post('/conversations/direct', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { contactUserId } = req.body;

  if (!contactUserId || contactUserId === currentUserId) {
    res.status(400).json({ error: 'Valid contactUserId required' });
    return;
  }

  let conversation = db.getConversations().find(
    (c) => c.type === 'direct' && c.memberIds.includes(currentUserId) && c.memberIds.includes(contactUserId)
  );

  if (!conversation) {
    const now = new Date().toISOString();
    conversation = {
      id: `conv_${uuidv4().substring(0, 8)}`,
      type: 'direct',
      createdBy: currentUserId,
      memberIds: [currentUserId, contactUserId],
      adminIds: [currentUserId],
      createdAt: now,
      updatedAt: now,
    };
    db.getConversations().push(conversation);
    db.save();
  }

  res.json({ conversation });
});

// Get messages in a conversation
messageRouter.get('/conversations/:id/messages', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const conversation = db.getConversations().find((c) => c.id === req.params.id);

  if (!conversation || !conversation.memberIds.includes(currentUserId)) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const messages = db
    .getMessages()
    .filter((m) => m.conversationId === conversation.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json({ messages });
});

// Send a message
messageRouter.post('/conversations/:id/messages', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const currentUser = req.user!;
  const conversation = db.getConversations().find((c) => c.id === req.params.id);

  if (!conversation || !conversation.memberIds.includes(currentUserId)) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const {
    contentType,
    text,
    mediaUrl,
    mediaName,
    mediaSize,
    mediaDuration,
    encryptedPayload,
    isRecipientOnline, // Client reports recipient presence from WebSocket
  } = req.body;

  const otherMemberId = conversation.type === 'direct'
    ? conversation.memberIds.find((id) => id !== currentUserId)
    : undefined;

  const now = new Date().toISOString();
  const messageId = `msg_${uuidv4().substring(0, 8)}`;

  // Determine initial delivery state based on Storage Mode & Recipient Presence:
  // In Mode 1 (Local Device Storage):
  // If recipient is offline, message enters 'pending' state and is queued in sender-side Pending Transfers!
  // If recipient is online or Mode 3 (Cloud Sync), deliveryState becomes 'sent' or 'delivered'.
  let deliveryState: 'pending' | 'sent' | 'delivered' = 'sent';
  if (currentUser.storageMode === 'local_device' && otherMemberId && isRecipientOnline === false) {
    deliveryState = 'pending';
  } else if (isRecipientOnline === true) {
    deliveryState = 'delivered';
  }

  const newMessage: Message = {
    id: messageId,
    conversationId: conversation.id,
    senderId: currentUserId,
    recipientId: otherMemberId,
    contentType: (contentType as MessageContentType) || 'text',
    text,
    mediaUrl,
    mediaName,
    mediaSize,
    mediaDuration,
    encryptedPayload: currentUser.storageMode === 'local_device' ? undefined : encryptedPayload,
    deliveryState,
    reactions: {},
    createdAt: now,
    deliveredAt: deliveryState === 'delivered' ? now : undefined,
  };

  db.getMessages().push(newMessage);
  conversation.updatedAt = now;

  // If pending in local mode or media transfer, add to Pending Transfers queue
  if (deliveryState === 'pending' && otherMemberId) {
    const transfer: PendingTransfer = {
      id: `pt_${uuidv4().substring(0, 8)}`,
      messageId: newMessage.id,
      senderId: currentUserId,
      recipientId: otherMemberId,
      contentType: newMessage.contentType,
      mediaName: newMessage.mediaName || (newMessage.contentType === 'text' ? 'Encrypted Text' : 'Media file'),
      fileSize: newMessage.mediaSize || 1024,
      previewUrl: newMessage.mediaUrl,
      status: 'queued',
      createdAt: now,
      lastAttemptAt: now,
    };
    db.getPendingTransfers().push(transfer);
  }

  db.save();

  res.status(201).json({ message: newMessage });
});

// React to a message
messageRouter.post('/messages/:id/reaction', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { emoji } = req.body;
  const message = db.getMessages().find((m) => m.id === req.params.id);

  if (!message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  if (!message.reactions) message.reactions = {};
  if (emoji) {
    message.reactions[currentUserId] = emoji;
  } else {
    delete message.reactions[currentUserId];
  }

  db.save();
  res.json({ message });
});

// Star / Favourite a message
messageRouter.post('/messages/:id/star', authMiddleware, (req: AuthRequest, res: Response) => {
  const message = db.getMessages().find((m) => m.id === req.params.id);
  if (!message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  message.isStarred = !message.isStarred;
  db.save();
  res.json({ isStarred: message.isStarred });
});

// Delete message
messageRouter.delete('/messages/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { deleteForEveryone } = req.body;
  const message = db.getMessages().find((m) => m.id === req.params.id);

  if (!message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  if (deleteForEveryone && message.senderId === currentUserId) {
    message.isDeleted = true;
    message.text = 'This message was deleted';
    message.mediaUrl = undefined;
  } else {
    // Delete for me
    const msgs = db.getMessages();
    const idx = msgs.findIndex((m) => m.id === req.params.id);
    if (idx !== -1) msgs.splice(idx, 1);
  }

  db.save();
  res.json({ success: true });
});

// Acknowledge message delivery / read
messageRouter.post('/messages/:id/ack', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { state } = req.body; // 'delivered' or 'read'
  const message = db.getMessages().find((m) => m.id === req.params.id);

  if (!message) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  const now = new Date().toISOString();
  if (state === 'read') {
    message.deliveryState = 'read';
    message.readAt = now;
  } else if (state === 'delivered' && message.deliveryState !== 'read') {
    message.deliveryState = 'delivered';
    message.deliveredAt = now;
  }

  // If there was a pending transfer for this message, mark it completed
  const transfer = db.getPendingTransfers().find((t) => t.messageId === message.id);
  if (transfer) {
    transfer.status = 'completed';
  }

  db.save();
  res.json({ message });
});

// "My Pending Transfers" APIs (Core to Mode 1 Local Device Storage)
messageRouter.get('/pending-transfers', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const allUsers = db.getUsers();

  const transfers = db
    .getPendingTransfers()
    .filter((t) => t.senderId === currentUserId && t.status !== 'completed' && t.status !== 'cancelled')
    .map((t) => {
      const recipient = allUsers.find((u) => u.id === t.recipientId);
      return {
        ...t,
        recipient: recipient
          ? { id: recipient.id, username: recipient.username, displayName: recipient.displayName, avatar: recipient.avatar }
          : null,
      };
    });

  res.json({ transfers });
});

// Retry pending transfer
messageRouter.post('/pending-transfers/:id/retry', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const transfer = db.getPendingTransfers().find((t) => t.id === req.params.id && t.senderId === currentUserId);

  if (!transfer) {
    res.status(404).json({ error: 'Transfer not found' });
    return;
  }

  transfer.status = 'transferring';
  transfer.lastAttemptAt = new Date().toISOString();
  db.save();

  res.json({ transfer, message: 'Transfer retry initiated. Waiting for peer data channel.' });
});

// Cancel/Delete pending transfer
messageRouter.delete('/pending-transfers/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const transfers = db.getPendingTransfers();
  const idx = transfers.findIndex((t) => t.id === req.params.id && t.senderId === currentUserId);

  if (idx !== -1) {
    transfers[idx].status = 'cancelled';
    db.save();
  }

  res.json({ success: true, message: 'Pending transfer cancelled' });
});
