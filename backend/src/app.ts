import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import questionBankRoutes from './routes/questionBanks';
import examRoutes from './routes/exams';
import sessionRoutes from './routes/sessions';
import analyticsRoutes from './routes/analytics';
import proctoringRoutes from './routes/proctoring';
import { query, getDbMode } from './db';

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
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

export default app;
