import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { DailyFeedItem } from '../types';

export const feedRouter = Router();

// Get today's Daily Feed items (media received from accepted contacts)
feedRouter.get('/today', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const contacts = db.getContacts().filter((c) => c.userId === currentUserId);
  const contactIds = contacts.map((c) => c.contactUserId);

  // Return feed items where sender is an accepted contact or current user, and not expired
  const now = new Date();
  const feedItems = db
    .getDailyFeedItems()
    .filter((item) => (contactIds.includes(item.senderId) || item.senderId === currentUserId) && new Date(item.expiresAt) > now)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ feedItems });
});

// Like / Unlike feed item
feedRouter.post('/:id/like', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const item = db.getDailyFeedItems().find((i) => i.id === req.params.id);

  if (!item) {
    res.status(404).json({ error: 'Feed item not found' });
    return;
  }

  if (item.likes.includes(currentUserId)) {
    item.likes = item.likes.filter((id) => id !== currentUserId);
  } else {
    item.likes.push(currentUserId);
  }

  db.save();
  res.json({ likes: item.likes, isLiked: item.likes.includes(currentUserId) });
});

// React to feed item
feedRouter.post('/:id/react', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { emoji } = req.body;
  const item = db.getDailyFeedItems().find((i) => i.id === req.params.id);

  if (!item) {
    res.status(404).json({ error: 'Feed item not found' });
    return;
  }

  if (emoji) {
    item.reactions[currentUserId] = emoji;
  } else {
    delete item.reactions[currentUserId];
  }

  db.save();
  res.json({ reactions: item.reactions });
});

// Post a new daily moment
feedRouter.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const currentUser = req.user!;
  const { mediaUrl, mediaType, caption } = req.body;

  if (!mediaUrl) {
    res.status(400).json({ error: 'Media URL is required' });
    return;
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const newItem: DailyFeedItem = {
    id: `feed_${uuidv4().substring(0, 8)}`,
    senderId: currentUserId,
    senderName: currentUser.displayName,
    senderAvatar: currentUser.avatar,
    recipientId: 'broadcast',
    mediaUrl,
    mediaType: mediaType || 'image',
    caption: caption?.trim(),
    likes: [],
    reactions: {},
    createdAt: now.toISOString(),
    expiresAt: tomorrow.toISOString(),
  };

  db.getDailyFeedItems().unshift(newItem);
  db.save();

  res.status(201).json({ feedItem: newItem });
});
