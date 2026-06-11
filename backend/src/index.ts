import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import app from './app';
import { setupProctoringSocket } from './socket/proctoring';
import { initDatabase, getDbMode } from './db';

dotenv.config();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

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
