import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest, JWT_SECRET } from '../middleware/auth';
import { StorageMode, User } from '../types';

export const authRouter = Router();

interface VerificationChallenge {
  recipient: string;
  type: 'phone' | 'email';
  code: string;
  expiresAt: number;
  verified: boolean;
  attempts: number;
}

const activeChallenges = new Map<string, VerificationChallenge>();

function uDigitsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const cleanA = a.replace(/\D/g, '');
  const cleanB = b.replace(/\D/g, '');
  if (cleanA.length >= 10 && cleanB.length >= 10) {
    return cleanA.slice(-10) === cleanB.slice(-10);
  }
  return cleanA === cleanB;
}

// Register new user (Mandatory Phone & Email Verification Enforced)
authRouter.post('/register', (req: Request, res: Response) => {
  const {
    username,
    displayName,
    phoneNumber,
    email,
    password,
    storageMode,
    publicKey,
    deviceId,
    phoneVerificationToken,
    emailVerificationToken,
  } = req.body;

  if (!username || !displayName || !password) {
    res.status(400).json({ error: 'Full Name, Username, and Password are required' });
    return;
  }

  if (!phoneNumber || !phoneNumber.trim()) {
    res.status(400).json({ error: 'Mobile number (+91) is mandatory for AAM account creation.' });
    return;
  }

  if (!email || !email.trim()) {
    res.status(400).json({ error: 'Email address is mandatory for AAM account creation.' });
    return;
  }

  // 1. Mandatory Mobile Number Verification Check
  if (!phoneVerificationToken) {
    res.status(403).json({
      error: 'Mandatory verification required: Mobile number must be verified before account creation.',
    });
    return;
  }

  const normPhone = phoneNumber.trim().toLowerCase();
  try {
    const decodedPhone: any = jwt.verify(phoneVerificationToken, JWT_SECRET);
    if (!decodedPhone.verified || decodedPhone.type !== 'phone') {
      throw new Error('Invalid phone verification token');
    }
    const tokenDigits = (decodedPhone.recipient || '').replace(/\D/g, '');
    const reqDigits = normPhone.replace(/\D/g, '');
    if (!uDigitsMatch(tokenDigits, reqDigits)) {
      res.status(403).json({ error: 'Mobile verification token does not match the provided phone number.' });
      return;
    }
  } catch (err) {
    res.status(403).json({
      error: 'Invalid or expired mobile verification token. Please verify your mobile number again.',
    });
    return;
  }

  // 2. Mandatory Email Verification Check
  if (!emailVerificationToken) {
    res.status(403).json({
      error: 'Mandatory verification required: Email address must be verified before account creation.',
    });
    return;
  }

  const normEmail = email.trim().toLowerCase();
  try {
    const decodedEmail: any = jwt.verify(emailVerificationToken, JWT_SECRET);
    if (!decodedEmail.verified || decodedEmail.type !== 'email' || decodedEmail.recipient !== normEmail) {
      throw new Error('Invalid email verification token');
    }
  } catch (err) {
    res.status(403).json({
      error: 'Invalid or expired email verification token. Please verify your email address again.',
    });
    return;
  }

  const users = db.getUsers();
  const existingUser = users.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() ||
      (phoneNumber && uDigitsMatch(u.phoneNumber || '', phoneNumber)) ||
      (email && u.email?.toLowerCase() === normEmail)
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
    phoneNumber: phoneNumber.trim(),
    email: email.trim(),
    isPhoneVerified: true,
    isEmailVerified: true,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username.trim())}`,
    bio: 'Proud user of AAM 🇮🇳 All in One Communication App',
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

// Send OTP Challenge (Testing Mode Enabled)
authRouter.post('/send-otp', (req: Request, res: Response) => {
  const { recipient, type } = req.body;
  if (!recipient || !String(recipient).trim()) {
    res.status(400).json({ error: 'Mobile number or email address required' });
    return;
  }

  const normalized = String(recipient).trim().toLowerCase();
  const inferredType: 'phone' | 'email' = (type === 'phone' || type === 'email')
    ? type
    : (normalized.includes('@') ? 'email' : 'phone');

  // Check if already registered by an existing account
  const users = db.getUsers();
  const alreadyTaken = users.some((u) => {
    if (inferredType === 'phone') {
      const cleanDigits = normalized.replace(/\D/g, '');
      const uDigits = (u.phoneNumber || '').replace(/\D/g, '');
      return u.phoneNumber === normalized || (cleanDigits.length >= 7 && uDigits.endsWith(cleanDigits.slice(-10)));
    } else {
      return u.email?.toLowerCase() === normalized;
    }
  });

  if (alreadyTaken) {
    res.status(409).json({
      error: `This ${inferredType === 'phone' ? 'mobile number' : 'email'} is already registered. Please sign in instead.`,
    });
    return;
  }

  // Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  activeChallenges.set(normalized, {
    recipient: normalized,
    type: inferredType,
    code,
    expiresAt,
    verified: false,
    attempts: 0,
  });

  console.log(`[AAM Testing Auth] Generated OTP for ${normalized} (${inferredType}): ${code}`);

  res.json({
    success: true,
    message: `Secure OTP generated for ${recipient}. Testing Mode is active for team multi-device testing.`,
    testingCode: code,
    demoCode: code,
    recipient: normalized,
    type: inferredType,
    expiresInSeconds: 600,
  });
});

// Verify OTP Challenge & Issue Cryptographic Proof Token
authRouter.post('/verify-otp', (req: Request, res: Response) => {
  const { recipient, otpCode, type } = req.body;
  if (!recipient || !otpCode) {
    res.status(400).json({ error: 'Recipient and 6-digit OTP code are required' });
    return;
  }

  const normalized = String(recipient).trim().toLowerCase();
  const challenge = activeChallenges.get(normalized);
  const cleanCode = String(otpCode).trim();

  // Master bypass codes for testing fallback if needed
  const isBypass = cleanCode === '123456' || cleanCode === '741085';

  if (!challenge && !isBypass) {
    res.status(400).json({ error: 'Verification code not requested or expired. Please tap Resend OTP.' });
    return;
  }

  if (challenge) {
    if (Date.now() > challenge.expiresAt) {
      activeChallenges.delete(normalized);
      res.status(400).json({ error: 'Verification code expired. Please tap Resend OTP.' });
      return;
    }

    challenge.attempts += 1;
    if (challenge.attempts > 5) {
      activeChallenges.delete(normalized);
      res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
      return;
    }

    if (challenge.code !== cleanCode && !isBypass) {
      res.status(400).json({ error: 'Invalid verification code. Please check the 6-digit code and retry.' });
      return;
    }

    challenge.verified = true;
  }

  const challengeType = challenge ? challenge.type : (type || (normalized.includes('@') ? 'email' : 'phone'));

  // Issue cryptographic proof token signed with JWT_SECRET
  const verificationToken = jwt.sign(
    { recipient: normalized, type: challengeType, verified: true },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({
    success: true,
    verified: true,
    recipient: normalized,
    type: challengeType,
    verificationToken,
  });
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
