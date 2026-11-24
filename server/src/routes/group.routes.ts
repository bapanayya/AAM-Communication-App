import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Conversation, Message } from '../types';

export const groupRouter = Router();

// Create new group
groupRouter.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { name, description, avatar, memberIds } = req.body;

  if (!name) {
    res.status(400).json({ error: 'Group name is required' });
    return;
  }

  const now = new Date().toISOString();
  const allMembers = Array.from(new Set([currentUserId, ...(memberIds || [])]));

  const newGroup: Conversation = {
    id: `grp_${uuidv4().substring(0, 8)}`,
    type: 'group',
    name: name.trim(),
    description: description?.trim() || '',
    avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
    createdBy: currentUserId,
    memberIds: allMembers,
    adminIds: [currentUserId],
    createdAt: now,
    updatedAt: now,
  };

  db.getConversations().push(newGroup);

  // System join message
  const systemMsg: Message = {
    id: `msg_${uuidv4().substring(0, 8)}`,
    conversationId: newGroup.id,
    senderId: currentUserId,
    contentType: 'text',
    text: `${req.user!.displayName} created group "${name}".`,
    deliveryState: 'delivered',
    reactions: {},
    createdAt: now,
  };
  db.getMessages().push(systemMsg);

  db.save();
  res.status(201).json({ group: newGroup });
});

// Update group
groupRouter.patch('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const group = db.getConversations().find((c) => c.id === req.params.id && c.type === 'group');

  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  if (!group.adminIds.includes(currentUserId)) {
    res.status(403).json({ error: 'Only admins can edit group settings' });
    return;
  }

  const { name, description, avatar } = req.body;
  if (name) group.name = name.trim();
  if (description !== undefined) group.description = description.trim();
  if (avatar) group.avatar = avatar;
  group.updatedAt = new Date().toISOString();

  db.save();
  res.json({ group });
});

// Add member to group
groupRouter.post('/:id/members', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { memberId } = req.body;
  const group = db.getConversations().find((c) => c.id === req.params.id && c.type === 'group');

  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  if (!group.adminIds.includes(currentUserId)) {
    res.status(403).json({ error: 'Only admins can add members' });
    return;
  }

  if (!group.memberIds.includes(memberId)) {
    group.memberIds.push(memberId);
    group.updatedAt = new Date().toISOString();
    db.save();
  }

  res.json({ group });
});

// Remove member from group
groupRouter.delete('/:id/members/:memberId', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { memberId } = req.params;
  const group = db.getConversations().find((c) => c.id === req.params.id && c.type === 'group');

  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }

  if (!group.adminIds.includes(currentUserId) && currentUserId !== memberId) {
    res.status(403).json({ error: 'Not authorized to remove this member' });
    return;
  }

  group.memberIds = group.memberIds.filter((id) => id !== memberId);
  group.adminIds = group.adminIds.filter((id) => id !== memberId);
  group.updatedAt = new Date().toISOString();

  db.save();
  res.json({ group });
});

// Send broadcast message (creates 1-to-many messages in 1:1 conversations without revealing recipients to each other)
groupRouter.post('/broadcast', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { recipientIds, text, mediaUrl } = req.body;

  if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
    res.status(400).json({ error: 'Recipient IDs array required' });
    return;
  }

  const now = new Date().toISOString();
  const createdMessages: Message[] = [];

  recipientIds.forEach((recId) => {
    // Find or create direct conversation
    let conv = db.getConversations().find(
      (c) => c.type === 'direct' && c.memberIds.includes(currentUserId) && c.memberIds.includes(recId)
    );
    if (!conv) {
      conv = {
        id: `conv_${uuidv4().substring(0, 8)}`,
        type: 'direct',
        createdBy: currentUserId,
        memberIds: [currentUserId, recId],
        adminIds: [currentUserId],
        createdAt: now,
        updatedAt: now,
      };
      db.getConversations().push(conv);
    }

    const msg: Message = {
      id: `msg_${uuidv4().substring(0, 8)}`,
      conversationId: conv.id,
      senderId: currentUserId,
      recipientId: recId,
      contentType: mediaUrl ? 'mixed' : 'text',
      text: text ? `[Broadcast] ${text}` : '[Broadcast message]',
      mediaUrl,
      deliveryState: 'sent',
      reactions: {},
      createdAt: now,
    };

    db.getMessages().push(msg);
    createdMessages.push(msg);
  });

  db.save();
  res.status(201).json({ success: true, count: createdMessages.length, messages: createdMessages });
});
