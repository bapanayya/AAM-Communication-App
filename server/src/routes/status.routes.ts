import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { StatusUpdate } from '../types';

export const statusRouter = Router();

// Get active status updates grouped by user
statusRouter.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const contacts = db.getContacts().filter((c) => c.userId === currentUserId);
  const contactIds = contacts.map((c) => c.contactUserId);

  const now = new Date();
  const activeStatuses = db
    .getStatusUpdates()
    .filter((s) => {
      // Must not be expired
      if (new Date(s.expiresAt) <= now) return false;
      // Must be own or from accepted contact
      if (s.userId !== currentUserId && !contactIds.includes(s.userId)) return false;
      // Privacy check
      if (s.privacy === 'selected_contacts' && s.allowedContactIds && !s.allowedContactIds.includes(currentUserId) && s.userId !== currentUserId) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Group by user
  const grouped: Record<string, { user: any; stories: StatusUpdate[] }> = {};
  const allUsers = db.getUsers();

  activeStatuses.forEach((status) => {
    if (!grouped[status.userId]) {
      const u = allUsers.find((usr) => usr.id === status.userId);
      grouped[status.userId] = {
        user: {
          id: status.userId,
          displayName: status.userName,
          avatar: status.userAvatar,
          isSelf: status.userId === currentUserId,
        },
        stories: [],
      };
    }
    grouped[status.userId].stories.push(status);
  });

  res.json({ statusGroups: Object.values(grouped) });
});

// Create new status update
statusRouter.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const currentUser = req.user!;
  const { mediaType, mediaUrl, textContent, backgroundGradient, privacy, allowedContactIds } = req.body;

  if (mediaType !== 'text' && !mediaUrl) {
    res.status(400).json({ error: 'Media URL required for image/video status' });
    return;
  }
  if (mediaType === 'text' && !textContent) {
    res.status(400).json({ error: 'Text content required for text status' });
    return;
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const newStatus: StatusUpdate = {
    id: `stat_${uuidv4().substring(0, 8)}`,
    userId: currentUserId,
    userName: currentUser.displayName,
    userAvatar: currentUser.avatar,
    mediaType: mediaType || 'text',
    mediaUrl,
    textContent,
    backgroundGradient: backgroundGradient || 'from-amber-600 to-orange-600',
    viewers: [],
    privacy: privacy || 'all_contacts',
    allowedContactIds: privacy === 'selected_contacts' ? allowedContactIds : undefined,
    createdAt: now.toISOString(),
    expiresAt: tomorrow.toISOString(),
  };

  db.getStatusUpdates().push(newStatus);
  db.save();

  res.status(201).json({ status: newStatus });
});

// Mark status as viewed
statusRouter.post('/:id/view', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const status = db.getStatusUpdates().find((s) => s.id === req.params.id);

  if (!status) {
    res.status(404).json({ error: 'Status not found' });
    return;
  }

  if (!status.viewers.includes(currentUserId)) {
    status.viewers.push(currentUserId);
    db.save();
  }

  res.json({ viewersCount: status.viewers.length });
});

// Delete status
statusRouter.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const statuses = db.getStatusUpdates();
  const idx = statuses.findIndex((s) => s.id === req.params.id && s.userId === currentUserId);

  if (idx !== -1) {
    statuses.splice(idx, 1);
    db.save();
  }

  res.json({ success: true });
});
