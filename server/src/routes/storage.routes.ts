import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { UserBackup } from '../types';

export const storageRouter = Router();

// Storage overview summary
storageRouter.get('/summary', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const user = req.user!;
  const userMessages = db.getMessages().filter((m) => m.senderId === currentUserId || m.recipientId === currentUserId);
  const userBackups = db.getBackups().filter((b) => b.userId === currentUserId);

  // Calculate approximate storage usage
  let mediaBytes = 0;
  let textBytes = 0;
  userMessages.forEach((m) => {
    if (m.mediaSize) mediaBytes += m.mediaSize;
    if (m.text) textBytes += Buffer.byteLength(m.text, 'utf-8');
  });

  res.json({
    storageMode: user.storageMode,
    usage: {
      messagesCount: userMessages.length,
      mediaCount: userMessages.filter((m) => m.mediaUrl).length,
      mediaSizeBytes: mediaBytes,
      textSizeBytes: textBytes,
      totalLocalBytes: mediaBytes + textBytes,
    },
    backupsCount: userBackups.length,
    latestBackup: userBackups[userBackups.length - 1] || null,
  });
});

// Create cloud backup (For Mode 2: Local storage + Encrypted cloud backup)
storageRouter.post('/backup', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const { snapshotCiphertext, sizeBytes, deviceInfo } = req.body;

  if (!snapshotCiphertext) {
    res.status(400).json({ error: 'Client-encrypted snapshot ciphertext is required' });
    return;
  }

  const userBackups = db.getBackups().filter((b) => b.userId === currentUserId);
  const version = userBackups.length + 1;

  const newBackup: UserBackup = {
    id: `bkp_${uuidv4().substring(0, 8)}`,
    userId: currentUserId,
    version,
    snapshotCiphertext,
    sizeBytes: sizeBytes || 1024 * 1024 * 2.5,
    deviceInfo: deviceInfo || 'AUM Client Device',
    createdAt: new Date().toISOString(),
  };

  db.getBackups().push(newBackup);
  db.save();

  res.status(201).json({ backup: newBackup, message: 'Encrypted backup created successfully.' });
});

// List user backups
storageRouter.get('/backups', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const backups = db
    .getBackups()
    .filter((b) => b.userId === currentUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ backups });
});

// Restore backup
storageRouter.post('/backups/:id/restore', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const backup = db.getBackups().find((b) => b.id === req.params.id && b.userId === currentUserId);

  if (!backup) {
    res.status(404).json({ error: 'Backup not found' });
    return;
  }

  res.json({
    success: true,
    snapshotCiphertext: backup.snapshotCiphertext,
    version: backup.version,
    createdAt: backup.createdAt,
    message: 'Encrypted backup snapshot payload delivered for client-side local decryption.',
  });
});

// Clear cache
storageRouter.post('/clear-cache', authMiddleware, (_req: AuthRequest, res: Response) => {
  res.json({ success: true, message: 'Temporary media cache cleared on client.' });
});
