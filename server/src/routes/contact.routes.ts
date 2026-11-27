import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Contact, FriendRequest } from '../types';
import { getWebSocketGateway } from '../websocket/gateway';

export const contactRouter = Router();

// Get accepted contacts
contactRouter.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const contacts = db.getContacts().filter((c) => c.userId === currentUserId);
  const contactUserIds = contacts.map((c) => c.contactUserId);

  const contactProfiles = db
    .getUsers()
    .filter((u) => contactUserIds.includes(u.id))
    .map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      bio: u.bio,
      storageMode: u.storageMode,
      publicKey: u.publicKey,
    }));

  res.json({ contacts: contactProfiles });
});

// Send friend request
contactRouter.post('/requests', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  let { recipientId, identifier } = req.body;

  if (!recipientId && identifier) {
    const ident = String(identifier).trim();
    const cleanDigits = ident.replace(/\D/g, '');
    const allUsers = db.getUsers();
    const foundUser = allUsers.find(
      (u) =>
        u.username.toLowerCase() === ident.toLowerCase() ||
        (u.email && u.email.toLowerCase() === ident.toLowerCase()) ||
        (u.phoneNumber && (u.phoneNumber === ident || (cleanDigits.length >= 7 && u.phoneNumber.replace(/\D/g, '').endsWith(cleanDigits.slice(-10)))))
    );
    if (!foundUser) {
      res.status(404).json({ error: `User "${ident}" not found in registered accounts.` });
      return;
    }
    recipientId = foundUser.id;
  }

  if (!recipientId || recipientId === currentUserId) {
    res.status(400).json({
      error: recipientId === currentUserId ? 'Cannot send friend request to yourself' : 'Valid recipient ID or identifier required',
    });
    return;
  }

  // Check if blocked
  const isBlocked = db
    .getBlockedUsers()
    .some(
      (b) =>
        (b.blockerId === currentUserId && b.blockedUserId === recipientId) ||
        (b.blockerId === recipientId && b.blockedUserId === currentUserId)
    );
  if (isBlocked) {
    res.status(403).json({ error: 'Unable to send request to this user' });
    return;
  }

  // Check if already contacts
  const alreadyFriends = db
    .getContacts()
    .some((c) => c.userId === currentUserId && c.contactUserId === recipientId);
  if (alreadyFriends) {
    res.status(400).json({ error: 'Already contacts' });
    return;
  }

  // Check if request already pending
  const existingReq = db
    .getFriendRequests()
    .find(
      (r) =>
        ((r.senderId === currentUserId && r.recipientId === recipientId) ||
          (r.senderId === recipientId && r.recipientId === currentUserId)) &&
        r.status === 'pending'
    );
  if (existingReq) {
    res.status(400).json({ error: 'A pending request already exists between these users' });
    return;
  }

  const now = new Date().toISOString();
  const newRequest: FriendRequest = {
    id: `fr_${uuidv4().substring(0, 8)}`,
    senderId: currentUserId,
    recipientId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  db.getFriendRequests().push(newRequest);
  db.save();

  const gw = getWebSocketGateway();
  if (gw) {
    gw.sendToUser(recipientId, JSON.stringify({
      event: 'contact.request_received',
      data: {
        requestId: newRequest.id,
        sender: {
          id: req.user!.id,
          username: req.user!.username,
          displayName: req.user!.displayName,
          avatar: req.user!.avatar,
          phoneNumber: req.user!.phoneNumber,
        },
      },
    }));
  }

  res.status(201).json({ request: newRequest });
});

// Get friend requests (incoming & outgoing)
contactRouter.get('/requests', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const allUsers = db.getUsers();

  const incoming = db
    .getFriendRequests()
    .filter((r) => r.recipientId === currentUserId && r.status === 'pending')
    .map((r) => {
      const sender = allUsers.find((u) => u.id === r.senderId);
      return {
        ...r,
        sender: sender
          ? { id: sender.id, username: sender.username, displayName: sender.displayName, avatar: sender.avatar, bio: sender.bio }
          : null,
      };
    });

  const outgoing = db
    .getFriendRequests()
    .filter((r) => r.senderId === currentUserId && r.status === 'pending')
    .map((r) => {
      const recipient = allUsers.find((u) => u.id === r.recipientId);
      return {
        ...r,
        recipient: recipient
          ? { id: recipient.id, username: recipient.username, displayName: recipient.displayName, avatar: recipient.avatar, bio: recipient.bio }
          : null,
      };
    });

  res.json({ incoming, outgoing });
});

// Accept friend request
contactRouter.post('/requests/:id/accept', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const request = db.getFriendRequests().find((r) => r.id === req.params.id && r.recipientId === currentUserId);

  if (!request || request.status !== 'pending') {
    res.status(404).json({ error: 'Pending request not found' });
    return;
  }

  request.status = 'accepted';
  request.updatedAt = new Date().toISOString();

  const now = new Date().toISOString();
  const c1: Contact = { id: `c_${uuidv4().substring(0, 8)}`, userId: request.recipientId, contactUserId: request.senderId, relationshipStatus: 'accepted', createdAt: now };
  const c2: Contact = { id: `c_${uuidv4().substring(0, 8)}`, userId: request.senderId, contactUserId: request.recipientId, relationshipStatus: 'accepted', createdAt: now };

  db.getContacts().push(c1, c2);

  // Auto-create or ensure 1:1 conversation exists
  let conversation = db.getConversations().find(
    (c) => c.type === 'direct' && c.memberIds.includes(request.senderId) && c.memberIds.includes(request.recipientId)
  );

  if (!conversation) {
    conversation = {
      id: `conv_${uuidv4().substring(0, 8)}`,
      type: 'direct',
      createdBy: request.recipientId,
      memberIds: [request.senderId, request.recipientId],
      adminIds: [request.recipientId],
      createdAt: now,
      updatedAt: now,
    };
    db.getConversations().push(conversation);
  }

  db.save();

  const gw = getWebSocketGateway();
  if (gw) {
    gw.sendToUser(request.senderId, JSON.stringify({
      event: 'contact.request_accepted',
      data: {
        requestId: request.id,
        conversationId: conversation.id,
        friend: {
          id: req.user!.id,
          username: req.user!.username,
          displayName: req.user!.displayName,
          avatar: req.user!.avatar,
          phoneNumber: req.user!.phoneNumber,
        },
      },
    }));
  }

  res.json({ success: true, message: 'Friend request accepted', conversationId: conversation.id });
});

// Reject friend request
contactRouter.post('/requests/:id/reject', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const request = db.getFriendRequests().find((r) => r.id === req.params.id && r.recipientId === currentUserId);

  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  request.status = 'rejected';
  request.updatedAt = new Date().toISOString();
  db.save();

  res.json({ success: true, message: 'Friend request rejected' });
});

// Cancel outgoing friend request
contactRouter.post('/requests/:id/cancel', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const request = db.getFriendRequests().find((r) => r.id === req.params.id && r.senderId === currentUserId);

  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  request.status = 'cancelled';
  request.updatedAt = new Date().toISOString();
  db.save();

  res.json({ success: true, message: 'Friend request cancelled' });
});
