import { Router } from 'express';
import { query } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/events', authenticate, async (req, res) => {
  try {
    const { sessionId, eventType, description, severity, metadata } = req.body;

    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'Session ID and event type are required' });
    }

    const sessionResult = await query(
      `SELECT * FROM exam_sessions WHERE id = $1 AND student_id = $2`,
      [sessionId, req.user!.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const result = await query(
      `INSERT INTO proctoring_events (session_id, event_type, description, severity, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sessionId, eventType, description, severity || 'low', JSON.stringify(metadata || {})]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Proctoring event error:', err);
    res.status(500).json({ error: 'Failed to log proctoring event' });
  }
});

router.get('/events/:sessionId', authenticate, authorize('admin', 'instructor', 'proctor'), async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM proctoring_events WHERE session_id = $1 ORDER BY created_at DESC`,
      [req.params.sessionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Failed to fetch proctoring events' });
  }
});

export default router;
