import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { BlockedUser } from '../types';

export const userRouter = Router();

// Search users by username, phone, email, or displayName
userRouter.get('/search', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const q = ((req.query.q as string) || '').toLowerCase().trim();

  const blockedIds = db
    .getBlockedUsers()
    .filter((b) => b.blockerId === currentUserId || b.blockedUserId === currentUserId)
    .map((b) => (b.blockerId === currentUserId ? b.blockedUserId : b.blockerId));

  // If query is empty, return discoverable users (e.g. for contact discovery and suggestions)
  if (!q) {
    const discoverable = db
      .getUsers()
      .filter((u) => u.id !== currentUserId && !blockedIds.includes(u.id))
      .slice(0, 20)
      .map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar,
        bio: u.bio,
        storageMode: u.storageMode,
      }));
    res.json({ users: discoverable });
    return;
  }

  const results = db
    .getUsers()
    .filter((u) => u.id !== currentUserId && !blockedIds.includes(u.id))
    .filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.phoneNumber && u.phoneNumber.includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    )
    .map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      bio: u.bio,
      storageMode: u.storageMode,
    }));

  res.json({ users: results });
});

// Get user profile by ID
userRouter.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = db.getUsers().find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      storageMode: user.storageMode,
      createdAt: user.createdAt,
    },
  });
});

// Update own profile
userRouter.patch('/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { displayName, bio, avatar, publicKey } = req.body;

  if (displayName) user.displayName = displayName.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (avatar) user.avatar = avatar;
  if (publicKey) user.publicKey = publicKey;
  user.updatedAt = new Date().toISOString();

  db.save();
  res.json({ user });
});

// Get user settings
userRouter.get('/settings/me', authMiddleware, (req: AuthRequest, res: Response) => {
  let settings = db.getSettings().find((s) => s.userId === req.user!.id);
  if (!settings) {
    settings = {
      userId: req.user!.id,
      allowLastSeen: true,
      allowReadReceipts: true,
      specialAlertContacts: [],
      theme: 'dark',
      autoDownloadMedia: true,
      videoQuality: 'high',
    };
    db.getSettings().push(settings);
    db.save();
  }
  res.json({ settings });
});

// Update user settings
userRouter.patch('/settings/me', authMiddleware, (req: AuthRequest, res: Response) => {
  let settings = db.getSettings().find((s) => s.userId === req.user!.id);
  if (!settings) {
    settings = {
      userId: req.user!.id,
      allowLastSeen: true,
      allowReadReceipts: true,
      specialAlertContacts: [],
      theme: 'dark',
      autoDownloadMedia: true,
      videoQuality: 'high',
    };
    db.getSettings().push(settings);
  }

  const { allowLastSeen, allowReadReceipts, specialAlertContacts, theme, autoDownloadMedia, videoQuality } = req.body;
  if (allowLastSeen !== undefined) settings.allowLastSeen = allowLastSeen;
  if (allowReadReceipts !== undefined) settings.allowReadReceipts = allowReadReceipts;
  if (specialAlertContacts !== undefined) settings.specialAlertContacts = specialAlertContacts;
  if (theme !== undefined) settings.theme = theme;
  if (autoDownloadMedia !== undefined) settings.autoDownloadMedia = autoDownloadMedia;
  if (videoQuality !== undefined) settings.videoQuality = videoQuality;

  db.save();
  res.json({ settings });
});

// Block user
userRouter.post('/:id/block', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (currentUserId === targetUserId) {
    res.status(400).json({ error: 'Cannot block yourself' });
    return;
  }

  const existingBlock = db
    .getBlockedUsers()
    .find((b) => b.blockerId === currentUserId && b.blockedUserId === targetUserId);

  if (!existingBlock) {
    const blockRecord: BlockedUser = {
      id: `blk_${uuidv4().substring(0, 8)}`,
      blockerId: currentUserId,
      blockedUserId: targetUserId,
      createdAt: new Date().toISOString(),
    };
    db.getBlockedUsers().push(blockRecord);
    db.save();
  }

  res.json({ success: true, message: 'User blocked' });
});

// Unblock user
userRouter.delete('/:id/block', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const targetUserId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const blocks = db.getBlockedUsers();
  const idx = blocks.findIndex((b) => b.blockerId === currentUserId && b.blockedUserId === targetUserId);
  if (idx !== -1) {
    blocks.splice(idx, 1);
    db.save();
  }

  res.json({ success: true, message: 'User unblocked' });
});

// List blocked users
userRouter.get('/blocks/list', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const blockedIds = db
    .getBlockedUsers()
    .filter((b) => b.blockerId === currentUserId)
    .map((b) => b.blockedUserId);

  const blockedUsers = db.getUsers().filter((u) => blockedIds.includes(u.id));
  res.json({ blockedUsers });
});
