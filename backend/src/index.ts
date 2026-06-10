import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import questionBankRoutes from './routes/questionBanks';
import examRoutes from './routes/exams';
import sessionRoutes from './routes/sessions';
import analyticsRoutes from './routes/analytics';
import proctoringRoutes from './routes/proctoring';
import { setupProctoringSocket } from './socket/proctoring';
import { initDatabase, query, getDbMode } from './db';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', service: 'Invigilo API', database: getDbMode() || 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', service: 'Invigilo API', database: 'unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/question-banks', questionBankRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/proctoring', proctoringRoutes);

setupProctoringSocket(io);

const PORT = process.env.PORT || 5000;

initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database mode: ${getDbMode()}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
