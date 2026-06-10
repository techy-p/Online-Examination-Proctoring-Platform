import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthUser } from '../middleware/auth';
import { query } from '../db';

interface SignalingPayload {
  sessionId: string;
  targetId?: string;
  offer?: Record<string, unknown>;
  answer?: Record<string, unknown>;
  candidate?: Record<string, unknown>;
}

const activeRooms = new Map<string, Set<string>>();

export function setupProctoringSocket(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthUser;
    console.log(`Socket connected: ${user.fullName} (${user.role})`);

    socket.on('join-exam-room', async ({ sessionId }: { sessionId: string }) => {
      try {
        const session = await query(
          `SELECT student_id FROM exam_sessions WHERE id = $1 AND status = 'in_progress'`,
          [sessionId]
        );
        const canJoin = session.rows.length > 0 && (
          user.role === 'admin'
          || user.role === 'proctor'
          || (user.role === 'student' && session.rows[0].student_id === user.id)
        );

        if (!canJoin) {
          socket.emit('proctoring-error', { message: 'Access denied for this exam session' });
          return;
        }

        const room = `exam-${sessionId}`;
        socket.join(room);

        if (!activeRooms.has(room)) {
          activeRooms.set(room, new Set());
        }
        activeRooms.get(room)!.add(socket.id);

        socket.to(room).emit('peer-joined', {
          peerId: socket.id,
          role: user.role,
          name: user.fullName,
        });

        const peers = Array.from(activeRooms.get(room)!).filter((id) => id !== socket.id);
        socket.emit('existing-peers', peers);
      } catch {
        socket.emit('proctoring-error', { message: 'Unable to join exam session' });
      }
    });

    socket.on('webrtc-offer', (payload: SignalingPayload) => {
      if (payload.targetId) {
        io.to(payload.targetId).emit('webrtc-offer', {
          ...payload,
          fromId: socket.id,
          fromName: user.fullName,
          fromRole: user.role,
        });
      }
    });

    socket.on('webrtc-answer', (payload: SignalingPayload) => {
      if (payload.targetId) {
        io.to(payload.targetId).emit('webrtc-answer', {
          ...payload,
          fromId: socket.id,
        });
      }
    });

    socket.on('webrtc-ice-candidate', (payload: SignalingPayload) => {
      if (payload.targetId) {
        io.to(payload.targetId).emit('webrtc-ice-candidate', {
          ...payload,
          fromId: socket.id,
        });
      }
    });

    socket.on('proctor-alert', ({ sessionId, message, severity }) => {
      const room = `exam-${sessionId}`;
      io.to(room).emit('proctor-alert', {
        message,
        severity,
        from: user.fullName,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      activeRooms.forEach((peers, room) => {
        if (peers.has(socket.id)) {
          peers.delete(socket.id);
          socket.to(room).emit('peer-left', { peerId: socket.id });
          if (peers.size === 0) activeRooms.delete(room);
        }
      });
      console.log(`Socket disconnected: ${user.fullName}`);
    });
  });
}
