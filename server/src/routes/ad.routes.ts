import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Advertisement } from '../types';

export const adRouter = Router();

// Get active advertisements from contact network
adRouter.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const contacts = db.getContacts().filter((c) => c.userId === currentUserId);
  const contactIds = new Set([currentUserId, ...contacts.map((c) => c.contactUserId)]);

  const allAds = db.getAdvertisements();
  const now = new Date();

  // Return ads from contacts, user, or platform contact network
  const ads = allAds
    .filter((ad) => {
      // Check expiration if set
      if (ad.expiresAt && new Date(ad.expiresAt) <= now) {
        return false;
      }
      // If contact network has ads, or show ads from known demo contacts
      return contactIds.has(ad.userId) || ['usr_priya', 'usr_vikram', 'usr_aarav'].includes(ad.userId);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ advertisements: ads });
});

// Post a new advertisement to all contacts
adRouter.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const currentUser = db.getUsers().find((u) => u.id === currentUserId);

  if (!currentUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { headline, caption, mediaType, mediaUrl, ctaText, ctaLink, price, tags } = req.body;

  if (!headline || !mediaUrl) {
    res.status(400).json({ error: 'Headline and mediaUrl are required' });
    return;
  }

  const newAd: Advertisement = {
    id: 'ad_' + uuidv4(),
    userId: currentUserId,
    userName: currentUser.displayName || currentUser.username,
    userAvatar: currentUser.avatar,
    userPhone: currentUser.phoneNumber,
    mediaType: mediaType === 'video' ? 'video' : 'image',
    mediaUrl,
    headline: headline.trim(),
    caption: (caption || '').trim(),
    ctaText: ctaText ? ctaText.trim() : 'Inquire on Chat',
    ctaLink: ctaLink ? ctaLink.trim() : currentUserId,
    price: price ? price.trim() : undefined,
    likes: [],
    sharesCount: 0,
    tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
    createdAt: new Date().toISOString(),
  };

  db.getAdvertisements().unshift(newAd);
  db.save();

  res.status(201).json({ advertisement: newAd });
});

// Like / unlike an advertisement
adRouter.post('/:id/like', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const ad = db.getAdvertisements().find((a) => a.id === req.params.id);

  if (!ad) {
    res.status(404).json({ error: 'Advertisement not found' });
    return;
  }

  if (!ad.likes) {
    ad.likes = [];
  }

  const index = ad.likes.indexOf(currentUserId);
  if (index > -1) {
    ad.likes.splice(index, 1);
  } else {
    ad.likes.push(currentUserId);
  }

  db.save();
  res.json({
    likes: ad.likes,
    likesCount: ad.likes.length,
    isLiked: ad.likes.includes(currentUserId),
  });
});

// Share advertisement (increment share counter)
adRouter.post('/:id/share', authMiddleware, (_req: AuthRequest, res: Response) => {
  const ad = db.getAdvertisements().find((a) => a.id === _req.params.id);

  if (!ad) {
    res.status(404).json({ error: 'Advertisement not found' });
    return;
  }

  ad.sharesCount = (ad.sharesCount || 0) + 1;
  db.save();

  res.json({ sharesCount: ad.sharesCount });
});

// Delete user's own advertisement
adRouter.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const allAds = db.getAdvertisements();
  const index = allAds.findIndex((a) => a.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Advertisement not found' });
    return;
  }

  if (allAds[index].userId !== currentUserId) {
    res.status(403).json({ error: 'Unauthorized to delete this advertisement' });
    return;
  }

  allAds.splice(index, 1);
  db.save();

  res.json({ success: true });
});
