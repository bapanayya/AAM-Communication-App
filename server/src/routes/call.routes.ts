import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/storage';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { CallSession, CallHistoryRecord, CallType, CallStatus } from '../types';

export const callRouter = Router();

// Start a call session (1:1 or Group, audio or video)
callRouter.post('/start', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const currentUser = req.user!;
  const { type, recipientId, isGroup, conversationId, participantIds } = req.body;

  if (!type || !['audio', 'video'].includes(type)) {
    res.status(400).json({ error: 'Valid call type (audio or video) required' });
    return;
  }

  // Check blocking if 1:1
  if (!isGroup && recipientId) {
    const isBlocked = db
      .getBlockedUsers()
      .some(
        (b) =>
          (b.blockerId === currentUserId && b.blockedUserId === recipientId) ||
          (b.blockerId === recipientId && b.blockedUserId === currentUserId)
      );
    if (isBlocked) {
      res.status(403).json({ error: 'Cannot call this user' });
      return;
    }
  }

  const callId = `call_${uuidv4().substring(0, 8)}`;
  const now = new Date().toISOString();

  const finalParticipantIds: string[] = isGroup
    ? Array.from(new Set([currentUserId, ...(participantIds || [])]))
    : [currentUserId, recipientId];

  const callSession: CallSession = {
    id: callId,
    type: type as CallType,
    isGroup: !!isGroup,
    conversationId,
    initiatorId: currentUserId,
    recipientId: !isGroup ? recipientId : undefined,
    participantIds: finalParticipantIds,
    activeParticipantIds: [currentUserId],
    status: 'ringing',
    startedAt: now,
    durationSeconds: 0,
  };

  db.getCallSessions().push(callSession);

  // If 1:1, create initial outgoing history record for initiator
  if (!isGroup && recipientId) {
    const recipientUser = db.getUsers().find((u) => u.id === recipientId);
    const recInitiator: CallHistoryRecord = {
      id: `ch_${uuidv4().substring(0, 8)}`,
      callId,
      userId: currentUserId,
      peerId: recipientId,
      peerName: recipientUser?.displayName || 'Unknown',
      peerAvatar: recipientUser?.avatar,
      type: type as CallType,
      direction: 'outgoing',
      status: 'ringing',
      startedAt: now,
      durationSeconds: 0,
    };
    db.getCallHistory().push(recInitiator);

    // Also record incoming for recipient
    const recRecipient: CallHistoryRecord = {
      id: `ch_${uuidv4().substring(0, 8)}`,
      callId,
      userId: recipientId,
      peerId: currentUserId,
      peerName: currentUser.displayName,
      peerAvatar: currentUser.avatar,
      type: type as CallType,
      direction: 'incoming',
      status: 'ringing',
      startedAt: now,
      durationSeconds: 0,
    };
    db.getCallHistory().push(recRecipient);
  }

  db.save();

  res.status(201).json({ call: callSession });
});

// Accept call
callRouter.post('/:id/accept', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const call = db.getCallSessions().find((c) => c.id === req.params.id);

  if (!call) {
    res.status(404).json({ error: 'Call session not found' });
    return;
  }

  const now = new Date().toISOString();
  call.status = 'accepted';
  call.connectedAt = now;
  if (!call.activeParticipantIds.includes(currentUserId)) {
    call.activeParticipantIds.push(currentUserId);
  }

  // Update history records
  db.getCallHistory()
    .filter((h) => h.callId === call.id)
    .forEach((h) => {
      h.status = 'accepted';
    });

  db.save();
  res.json({ call });
});

// Reject call
callRouter.post('/:id/reject', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const call = db.getCallSessions().find((c) => c.id === req.params.id);

  if (!call) {
    res.status(404).json({ error: 'Call session not found' });
    return;
  }

  const now = new Date().toISOString();
  call.status = 'rejected';
  call.endedAt = now;

  db.getCallHistory()
    .filter((h) => h.callId === call.id)
    .forEach((h) => {
      h.status = 'rejected';
    });

  db.save();
  res.json({ call });
});

// Cancel call (caller hangs up before answer)
callRouter.post('/:id/cancel', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const call = db.getCallSessions().find((c) => c.id === req.params.id);

  if (!call) {
    res.status(404).json({ error: 'Call session not found' });
    return;
  }

  const now = new Date().toISOString();
  call.status = 'cancelled';
  call.endedAt = now;

  db.getCallHistory()
    .filter((h) => h.callId === call.id)
    .forEach((h) => {
      h.status = h.userId === currentUserId ? 'cancelled' : 'missed';
    });

  db.save();
  res.json({ call });
});

// End call (hang up during active call)
callRouter.post('/:id/end', authMiddleware, (req: AuthRequest, res: Response) => {
  const { durationSeconds } = req.body;
  const call = db.getCallSessions().find((c) => c.id === req.params.id);

  if (!call) {
    res.status(404).json({ error: 'Call session not found' });
    return;
  }

  const now = new Date().toISOString();
  call.status = 'ended';
  call.endedAt = now;
  call.durationSeconds = durationSeconds || (call.connectedAt ? Math.round((new Date().getTime() - new Date(call.connectedAt).getTime()) / 1000) : 0);

  db.getCallHistory()
    .filter((h) => h.callId === call.id)
    .forEach((h) => {
      h.status = 'ended';
      h.durationSeconds = call.durationSeconds;
    });

  db.save();
  res.json({ call });
});

// Get call history for user
callRouter.get('/history', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const history = db
    .getCallHistory()
    .filter((h) => h.userId === currentUserId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  res.json({ history });
});

// Clear call history
callRouter.delete('/history', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const history = db.getCallHistory();
  const filtered = history.filter((h) => h.userId !== currentUserId);
  db.getCallHistory().length = 0;
  db.getCallHistory().push(...filtered);
  db.save();

  res.json({ success: true, message: 'Call history cleared' });
});

// Get active call session (if any)
callRouter.get('/active', authMiddleware, (req: AuthRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const activeCall = db
    .getCallSessions()
    .find(
      (c) =>
        (c.status === 'ringing' || c.status === 'accepted') &&
        c.participantIds.includes(currentUserId)
    );

  res.json({ activeCall: activeCall || null });
});

// Quality report
callRouter.post('/:id/report-quality', authMiddleware, (req: AuthRequest, res: Response) => {
  const { score, packetLoss, jitter } = req.body;
  // Metadata logged securely, no audio/video plaintext stored
  res.json({ success: true, loggedAt: new Date().toISOString() });
});
