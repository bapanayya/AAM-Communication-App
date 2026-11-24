import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest, JWT_SECRET } from '../middleware/auth';
import { StorageMode, User } from '../types';

export const authRouter = Router();

// Register new user
authRouter.post('/register', (req: Request, res: Response) => {
  const { username, displayName, phoneNumber, email, password, storageMode, publicKey, deviceId } = req.body;

  if (!username || !displayName || !password) {
    res.status(400).json({ error: 'Username, display name, and password are required' });
    return;
  }

  const users = db.getUsers();
  const existingUser = users.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() ||
      (phoneNumber && u.phoneNumber === phoneNumber) ||
      (email && u.email?.toLowerCase() === email.toLowerCase())
  );

  if (existingUser) {
    res.status(409).json({ error: 'Username, phone number, or email is already registered' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  const newUser: User = {
    id: `usr_${uuidv4().substring(0, 8)}`,
    username: username.trim(),
    displayName: displayName.trim(),
    phoneNumber: phoneNumber?.trim(),
    email: email?.trim(),
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
    bio: 'Proud user of AUM 🇮🇳 Privacy-First Messaging',
    storageMode: (storageMode as StorageMode) || 'local_device',
    publicKey: publicKey || `pub_${uuidv4()}`,
    deviceId: deviceId || `dev_${uuidv4().substring(0, 8)}`,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  db.getCredentials().push({ userId: newUser.id, passwordHash, salt });
  db.getSettings().push({
    userId: newUser.id,
    allowLastSeen: true,
    allowReadReceipts: true,
    specialAlertContacts: [],
    theme: 'dark',
    autoDownloadMedia: true,
    videoQuality: 'high',
  });

  db.save();

  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, user: newUser });
});

// Login
authRouter.post('/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    res.status(400).json({ error: 'Identifier and password are required' });
    return;
  }

  const users = db.getUsers();
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === identifier.toLowerCase() ||
      u.phoneNumber === identifier ||
      u.email?.toLowerCase() === identifier.toLowerCase()
  );

  if (!user) {
    res.status(401).json({ error: 'Invalid username/phone/email or password' });
    return;
  }

  const cred = db.getCredentials().find((c) => c.userId === user.id);
  if (!cred || !bcrypt.compareSync(password, cred.passwordHash)) {
    res.status(401).json({ error: 'Invalid username/phone/email or password' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user });
});

// Demo quick-login switch (very handy for testing multiple user perspectives like Aarav, Priya, Vikram)
authRouter.post('/demo-login', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.getUsers().find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ error: 'Demo user not found' });
    return;
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user });
});

// OTP Simulation for Indian numbers (+91) or email
authRouter.post('/send-otp', (req: Request, res: Response) => {
  const { recipient } = req.body;
  if (!recipient) {
    res.status(400).json({ error: 'Phone number or email required' });
    return;
  }
  // Simulated OTP code (e.g. 741085 or 123456)
  res.json({
    success: true,
    message: `Secure OTP generated and sent to ${recipient}. For demo verification, use code: 123456`,
    demoCode: '123456',
  });
});

authRouter.post('/verify-otp', (req: Request, res: Response) => {
  const { recipient, otpCode } = req.body;
  if (otpCode === '123456' || otpCode === '741085') {
    res.json({ success: true, verified: true, recipient });
  } else {
    res.status(400).json({ error: 'Invalid verification code. Please check and retry.' });
  }
});

// Get current user profile
authRouter.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Switch storage mode (Local Device, Local + Encrypted Backup, Cloud Sync)
authRouter.post('/switch-storage-mode', authMiddleware, (req: AuthRequest, res: Response) => {
  const { storageMode } = req.body;
  if (!['local_device', 'local_backup', 'cloud_sync'].includes(storageMode)) {
    res.status(400).json({ error: 'Invalid storage mode selected' });
    return;
  }

  const user = req.user!;
  user.storageMode = storageMode as StorageMode;
  user.updatedAt = new Date().toISOString();
  db.save();

  res.json({
    success: true,
    user,
    message: `Storage mode successfully migrated to ${storageMode}.`,
  });
});
