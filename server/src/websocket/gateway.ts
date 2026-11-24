import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';
import { db } from '../db/storage';

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WebSocketGateway {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedSocket>> = new Map(); // userId -> Set of active sockets (multi-device)

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.init();
  }

  private init() {
    this.wss.on('connection', (ws: AuthenticatedSocket, req) => {
      ws.isAlive = true;

      // Extract token from query string ?token=...
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
          this.registerUserSocket(decoded.userId, ws);
        } catch (err) {
          console.warn('WS auth token invalid');
        }
      }

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          this.handleMessage(ws, data);
        } catch (err) {
          console.error('Invalid WS message payload', err);
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.removeUserSocket(ws.userId, ws);
        }
      });

      ws.on('error', (err) => {
        console.error('WS socket error:', err);
      });
    });

    // Heartbeat ping interval (every 30 seconds)
    setInterval(() => {
      this.wss.clients.forEach((client: AuthenticatedSocket) => {
        if (client.isAlive === false) {
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      });
    }, 30000);
  }

  private registerUserSocket(userId: string, ws: AuthenticatedSocket) {
    ws.userId = userId;
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);

    // Broadcast presence update: user is now ONLINE
    this.broadcastPresence(userId, true);

    // Send initial connection ACK and online users list
    ws.send(
      JSON.stringify({
        event: 'connected',
        data: {
          userId,
          onlineUserIds: Array.from(this.clients.keys()),
        },
      })
    );

    // If this user was the recipient of pending transfers, notify senders that recipient is now online!
    this.checkPendingTransfersForUser(userId);
  }

  private removeUserSocket(userId: string, ws: AuthenticatedSocket) {
    const userSockets = this.clients.get(userId);
    if (userSockets) {
      userSockets.delete(ws);
      if (userSockets.size === 0) {
        this.clients.delete(userId);
        // Broadcast presence update: user is now OFFLINE
        this.broadcastPresence(userId, false);
      }
    }
  }

  private broadcastPresence(userId: string, isOnline: boolean) {
    // Notify all accepted contacts of this user
    const contacts = db.getContacts().filter((c) => c.userId === userId || c.contactUserId === userId);
    const targetUserIds = new Set<string>();
    contacts.forEach((c) => {
      targetUserIds.add(c.userId === userId ? c.contactUserId : c.userId);
    });

    const payload = JSON.stringify({
      event: 'presence.update',
      data: {
        userId,
        isOnline,
        lastActive: new Date().toISOString(),
      },
    });

    targetUserIds.forEach((targetId) => {
      this.sendToUser(targetId, payload);
    });
  }

  private checkPendingTransfersForUser(recipientId: string) {
    const transfers = db.getPendingTransfers().filter((t) => t.recipientId === recipientId && t.status === 'queued');
    transfers.forEach((t) => {
      // Notify sender that recipient is now online so sender client can automatically push/transfer!
      this.sendToUser(
        t.senderId,
        JSON.stringify({
          event: 'transfer.recipient_online',
          data: {
            transferId: t.id,
            messageId: t.messageId,
            recipientId,
          },
        })
      );
    });
  }

  private handleMessage(ws: AuthenticatedSocket, message: { event: string; data: any }) {
    const { event, data } = message;

    if (event === 'auth') {
      try {
        const decoded = jwt.verify(data.token, JWT_SECRET) as { userId: string };
        this.registerUserSocket(decoded.userId, ws);
      } catch (err) {
        ws.send(JSON.stringify({ event: 'error', data: { message: 'Authentication failed' } }));
      }
      return;
    }

    if (!ws.userId) {
      ws.send(JSON.stringify({ event: 'error', data: { message: 'Not authenticated' } }));
      return;
    }

    const senderId = ws.userId;

    switch (event) {
      // Typing indicator
      case 'typing.start':
      case 'typing.stop': {
        const { conversationId, recipientId } = data;
        if (recipientId) {
          this.sendToUser(recipientId, JSON.stringify({ event, data: { senderId, conversationId } }));
        } else if (conversationId) {
          const conv = db.getConversations().find((c) => c.id === conversationId);
          if (conv) {
            conv.memberIds.forEach((mId) => {
              if (mId !== senderId) {
                this.sendToUser(mId, JSON.stringify({ event, data: { senderId, conversationId } }));
              }
            });
          }
        }
        break;
      }

      // New Message broadcast over WS
      case 'message.send': {
        const { message: newMsg, recipientId, conversationId } = data;
        if (recipientId) {
          this.sendToUser(recipientId, JSON.stringify({ event: 'message.new', data: { message: newMsg } }));
        } else if (conversationId) {
          const conv = db.getConversations().find((c) => c.id === conversationId);
          if (conv) {
            conv.memberIds.forEach((mId) => {
              if (mId !== senderId) {
                this.sendToUser(mId, JSON.stringify({ event: 'message.new', data: { message: newMsg } }));
              }
            });
          }
        }
        break;
      }

      // Read & delivery acknowledgements
      case 'message.delivered':
      case 'message.read': {
        const { messageId, senderId: originalSenderId } = data;
        if (originalSenderId) {
          this.sendToUser(
            originalSenderId,
            JSON.stringify({
              event,
              data: { messageId, readBy: senderId, timestamp: new Date().toISOString() },
            })
          );
        }
        break;
      }

      // WebRTC Calling Signalling
      case 'call.invite': {
        const { callId, recipientId, type, isGroup, conversationId } = data;
        const sender = db.getUsers().find((u) => u.id === senderId);
        const payload = JSON.stringify({
          event: 'call.incoming',
          data: {
            callId,
            initiatorId: senderId,
            initiatorName: sender?.displayName || 'Unknown',
            initiatorAvatar: sender?.avatar,
            type,
            isGroup: !!isGroup,
            conversationId,
          },
        });

        if (recipientId) {
          this.sendToUser(recipientId, payload);
        } else if (conversationId) {
          const conv = db.getConversations().find((c) => c.id === conversationId);
          if (conv) {
            conv.memberIds.forEach((mId) => {
              if (mId !== senderId) this.sendToUser(mId, payload);
            });
          }
        }
        break;
      }

      case 'call.ringing': {
        const { callId, initiatorId } = data;
        this.sendToUser(initiatorId, JSON.stringify({ event: 'call.ringing', data: { callId, recipientId: senderId } }));
        break;
      }

      case 'call.accept': {
        const { callId, initiatorId } = data;
        this.sendToUser(initiatorId, JSON.stringify({ event: 'call.accepted', data: { callId, recipientId: senderId } }));
        break;
      }

      case 'call.reject': {
        const { callId, initiatorId } = data;
        this.sendToUser(initiatorId, JSON.stringify({ event: 'call.rejected', data: { callId, recipientId: senderId } }));
        break;
      }

      case 'call.cancel': {
        const { callId, recipientId, conversationId } = data;
        const payload = JSON.stringify({ event: 'call.cancelled', data: { callId, initiatorId: senderId } });
        if (recipientId) {
          this.sendToUser(recipientId, payload);
        } else if (conversationId) {
          const conv = db.getConversations().find((c) => c.id === conversationId);
          if (conv) {
            conv.memberIds.forEach((mId) => {
              if (mId !== senderId) this.sendToUser(mId, payload);
            });
          }
        }
        break;
      }

      case 'call.end': {
        const { callId, targetUserId, conversationId } = data;
        const payload = JSON.stringify({ event: 'call.ended', data: { callId, endedBy: senderId } });
        if (targetUserId) {
          this.sendToUser(targetUserId, payload);
        } else if (conversationId) {
          const conv = db.getConversations().find((c) => c.id === conversationId);
          if (conv) {
            conv.memberIds.forEach((mId) => {
              if (mId !== senderId) this.sendToUser(mId, payload);
            });
          }
        }
        break;
      }

      // WebRTC SDP Offer / Answer Relay
      case 'call.sdp': {
        const { targetUserId, sdp, callId } = data;
        this.sendToUser(targetUserId, JSON.stringify({ event: 'call.sdp', data: { senderId, callId, sdp } }));
        break;
      }

      // WebRTC ICE Candidate Relay
      case 'call.ice': {
        const { targetUserId, candidate, callId } = data;
        this.sendToUser(targetUserId, JSON.stringify({ event: 'call.ice', data: { senderId, callId, candidate } }));
        break;
      }

      // P2P DataChannel Transfer Events
      case 'transfer.direct_ready': {
        const { recipientId, transferId } = data;
        this.sendToUser(recipientId, JSON.stringify({ event: 'transfer.direct_ready', data: { senderId, transferId } }));
        break;
      }

      default:
        console.log('Unhandled WS event:', event);
    }
  }

  public sendToUser(userId: string, message: string) {
    const userSockets = this.clients.get(userId);
    if (userSockets) {
      userSockets.forEach((sock) => {
        if (sock.readyState === WebSocket.OPEN) {
          sock.send(message);
        }
      });
    }
  }

  public isUserOnline(userId: string): boolean {
    return this.clients.has(userId) && (this.clients.get(userId)?.size || 0) > 0;
  }
}
