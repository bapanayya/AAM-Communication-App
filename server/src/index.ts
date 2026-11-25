import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { contactRouter } from './routes/contact.routes';
import { messageRouter } from './routes/message.routes';
import { callRouter } from './routes/call.routes';
import { groupRouter } from './routes/group.routes';
import { feedRouter } from './routes/feed.routes';
import { statusRouter } from './routes/status.routes';
import { storageRouter } from './routes/storage.routes';
import { adRouter } from './routes/ad.routes';
import { WebSocketGateway } from './websocket/gateway';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/messages', messageRouter);
app.use('/api/calls', callRouter);
app.use('/api/groups', groupRouter);
app.use('/api/feed', feedRouter);
app.use('/api/status', statusRouter);
app.use('/api/storage', storageRouter);
app.use('/api/ads', adRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    app: 'AUM Privacy-First Messaging & Social Media',
    version: '1.0.0-make-in-india',
    timestamp: new Date().toISOString(),
  });
});

// Serve static frontend assets if built
const CLIENT_DIST = path.join(__dirname, '../../client/dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

// Initialize WebSocket Gateway
export const wsGateway = new WebSocketGateway(server);

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🕉️  AUM Full-Stack Messaging & Social Media Server`);
  console.log(`🇮🇳  Proudly Made in India | Sovereign Privacy Architecture`);
  console.log(`🚀  Application Web UI: http://localhost:${PORT}`);
  console.log(`⚡  API Endpoint:       http://localhost:${PORT}/api`);
  console.log(`📶  WebSocket Gateway:  ws://localhost:${PORT}/ws`);
  console.log(`=======================================================`);
});
