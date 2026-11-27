import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Message, PendingTransfer, MessageContentType, Conversation, MediaRecord } from '../types';
import { getWebSocketGateway } from '../websocket/gateway';

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

  const mediaRecords = db.getMediaRecords();
  const messages = db
    .getMessages()
    .filter((m) => m.conversationId === conversation.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((m) => {
      if (m.mediaHash) {
        const rec = mediaRecords.find((r) => r.hash === m.mediaHash);
        return {
          ...m,
          connectedConversationCount: rec ? rec.referencedConversationIds.length : 1,
        };
      }
      return m;
    });

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
    mediaHash,
    encryptedPayload,
    isRecipientOnline, // Client reports recipient presence from WebSocket
  } = req.body;

  const otherMemberId = conversation.type === 'direct'
    ? conversation.memberIds.find((id) => id !== currentUserId)
    : undefined;

  const now = new Date().toISOString();
  const messageId = `msg_${uuidv4().substring(0, 8)}`;

  let effectiveMediaHash = mediaHash;
  if (mediaUrl && !effectiveMediaHash) {
    effectiveMediaHash = `cas_sha256_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  }

  const gw = getWebSocketGateway();
  const recipientOnlineOnServer = otherMemberId && gw ? gw.isUserOnline(otherMemberId) : false;
  const isEffectiveRecipientOnline = isRecipientOnline === true || recipientOnlineOnServer;

  // Real-time delivery logic:
  // Text messages and standard media are NEVER stuck in pending!
  // If recipient is connected to the server right now: mark 'delivered'.
  // If recipient is offline: mark 'sent' (single tick). It will automatically flip to 'delivered' as soon as recipient connects!
  let deliveryState: 'pending' | 'sent' | 'delivered' = 'sent';
  if (isEffectiveRecipientOnline) {
    deliveryState = 'delivered';
  } else {
    deliveryState = 'sent';
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
    mediaHash: effectiveMediaHash,
    encryptedPayload: currentUser.storageMode === 'local_device' ? undefined : encryptedPayload,
    deliveryState,
    reactions: {},
    createdAt: now,
    deliveredAt: deliveryState === 'delivered' ? now : undefined,
  };

  db.getMessages().push(newMessage);
  conversation.updatedAt = now;

  // Single-Instance Storage tracking
  if (effectiveMediaHash) {
    const mediaRecords = db.getMediaRecords();
    let rec = mediaRecords.find((r) => r.hash === effectiveMediaHash);
    if (!rec) {
      rec = {
        hash: effectiveMediaHash,
        fileName: mediaName || 'file',
        fileSize: mediaSize || 0,
        mimeType: mediaName?.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
        remoteUrl: mediaUrl,
        referencedMessageIds: [newMessage.id],
        referencedConversationIds: [conversation.id],
        createdAt: now,
        lastAccessedAt: now,
        sourceConversationId: conversation.id,
      };
      mediaRecords.push(rec);
    } else {
      if (!rec.referencedMessageIds.includes(newMessage.id)) {
        rec.referencedMessageIds.push(newMessage.id);
      }
      if (!rec.referencedConversationIds.includes(conversation.id)) {
        rec.referencedConversationIds.push(conversation.id);
      }
      rec.lastAccessedAt = now;
    }
    newMessage.connectedConversationCount = rec.referencedConversationIds.length;
  }

  db.save();

  // Broadcast immediately via WebSocket to recipient(s)!
  if (gw) {
    if (otherMemberId) {
      gw.sendToUser(
        otherMemberId,
        JSON.stringify({
          event: 'message.new',
          data: { message: newMessage },
        })
      );
      if (deliveryState === 'delivered') {
        gw.sendToUser(
          currentUserId,
          JSON.stringify({
            event: 'message.delivered',
            data: {
              messageId: newMessage.id,
              readBy: otherMemberId,
              timestamp: now,
            },
          })
        );
      }
    } else {
      // Group chat
      conversation.memberIds.forEach((mId) => {
        if (mId !== currentUserId) {
          gw.sendToUser(
            mId,
            JSON.stringify({
              event: 'message.new',
              data: { message: newMessage },
            })
          );
        }
      });
    }
  }

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

// Forward Message to Multiple Conversations (Single-Instance Storage CAS)
messageRouter.post('/messages/:id/forward', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const currentUser = req.user!;
  const origMsg = db.getMessages().find((m) => m.id === req.params.id);

  if (!origMsg) {
    res.status(404).json({ error: 'Message not found' });
    return;
  }

  const { targetConversationIds } = req.body;
  if (!Array.isArray(targetConversationIds) || targetConversationIds.length === 0) {
    res.status(400).json({ error: 'targetConversationIds must be a non-empty array' });
    return;
  }

  const now = new Date().toISOString();
  const allConversations = db.getConversations();
  const mediaRecords = db.getMediaRecords();
  const forwardedMessages: Message[] = [];

  const origSender = db.getUsers().find((u) => u.id === origMsg.senderId);
  const senderDisplayName = origMsg.senderId === currentUserId ? 'You' : (origSender?.displayName || 'Contact');

  if (origMsg.mediaUrl && !origMsg.mediaHash) {
    origMsg.mediaHash = `cas_sha256_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  }

  for (const targetConvId of targetConversationIds) {
    const targetConv = allConversations.find((c) => c.id === targetConvId && c.memberIds.includes(currentUserId));
    if (!targetConv) continue;

    const otherMemberId = targetConv.type === 'direct'
      ? targetConv.memberIds.find((id) => id !== currentUserId)
      : undefined;

    const fwdMsgId = `msg_fwd_${uuidv4().substring(0, 8)}`;
    const fwdMsg: Message = {
      id: fwdMsgId,
      conversationId: targetConv.id,
      senderId: currentUserId,
      recipientId: otherMemberId,
      contentType: origMsg.contentType,
      text: origMsg.text,
      mediaUrl: origMsg.mediaUrl,
      mediaName: origMsg.mediaName,
      mediaSize: origMsg.mediaSize,
      mediaDuration: origMsg.mediaDuration,
      mediaHash: origMsg.mediaHash,
      forwardedFrom: {
        originalMessageId: origMsg.id,
        originalConversationId: origMsg.conversationId,
        senderName: senderDisplayName,
        forwardedAt: now,
      },
      deliveryState: 'delivered',
      reactions: {},
      createdAt: now,
    };

    db.getMessages().push(fwdMsg);
    targetConv.updatedAt = now;
    forwardedMessages.push(fwdMsg);

    // Register in single-instance media record
    if (origMsg.mediaHash) {
      let rec = mediaRecords.find((r) => r.hash === origMsg.mediaHash);
      if (!rec) {
        rec = {
          hash: origMsg.mediaHash,
          fileName: origMsg.mediaName || 'file',
          fileSize: origMsg.mediaSize || 0,
          mimeType: origMsg.mediaName?.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
          remoteUrl: origMsg.mediaUrl,
          referencedMessageIds: [origMsg.id, fwdMsgId],
          referencedConversationIds: [origMsg.conversationId, targetConv.id],
          createdAt: now,
          lastAccessedAt: now,
          sourceConversationId: origMsg.conversationId,
        };
        mediaRecords.push(rec);
      } else {
        if (!rec.referencedMessageIds.includes(fwdMsgId)) {
          rec.referencedMessageIds.push(fwdMsgId);
        }
        if (!rec.referencedConversationIds.includes(targetConv.id)) {
          rec.referencedConversationIds.push(targetConv.id);
        }
        rec.lastAccessedAt = now;
      }
    }
  }

  // Update connectedConversationCount
  if (origMsg.mediaHash) {
    const rec = mediaRecords.find((r) => r.hash === origMsg.mediaHash);
    const count = rec ? rec.referencedConversationIds.length : 1;
    forwardedMessages.forEach((m) => (m.connectedConversationCount = count));
    origMsg.connectedConversationCount = count;
  }

  db.save();

  res.json({
    success: true,
    forwardedMessages,
    totalConnectedChats: origMsg.mediaHash ? (mediaRecords.find((r) => r.hash === origMsg.mediaHash)?.referencedConversationIds.length || 1) : 1,
    savedStorageBytes: targetConversationIds.length * (origMsg.mediaSize || 0),
  });
});

// Get Connected Chats for a Media Item (Single-Instance Storage Proof)
messageRouter.get('/media/:hash/connected-chats', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const hash = req.params.hash;
  const rec = db.getMediaRecords().find((r) => r.hash === hash);

  if (!rec) {
    res.json({ mediaRecord: null, connectedConversations: [], savedBytes: 0, deviceStorageCopies: 1 });
    return;
  }

  const allConvs = db.getConversations();
  const allUsers = db.getUsers();
  const allMsgs = db.getMessages();

  const connectedConversations = allConvs
    .filter((c) => rec.referencedConversationIds.includes(c.id) && c.memberIds.includes(currentUserId))
    .map((c) => {
      let title = c.name;
      let avatar = c.avatar;
      if (c.type === 'direct') {
        const otherId = c.memberIds.find((id) => id !== currentUserId) || c.memberIds[0];
        const other = allUsers.find((u) => u.id === otherId);
        if (other) {
          title = other.displayName;
          avatar = other.avatar;
        }
      }
      const messageCount = allMsgs.filter((m) => m.conversationId === c.id && m.mediaHash === hash).length;
      return {
        id: c.id,
        title: title || 'Chat',
        avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
        type: c.type,
        messageCount,
      };
    });

  res.json({
    mediaRecord: rec,
    connectedConversations,
    deviceStorageCopies: 1, // Single-Instance Storage guaranteed
    savedBytes: (rec.referencedConversationIds.length - 1) * rec.fileSize,
  });
});
