import { Router } from 'express';
import { query } from '../db';
import { authenticate, authorize } from '../middleware/auth';
import { evaluateSession } from '../services/evaluation';

const router = Router();

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

router.post('/start/:examId', authenticate, authorize('student'), async (req, res) => {
  try {
    const examId = req.params.examId;
    const studentId = req.user!.id;

    const examResult = await query(
      `SELECT * FROM exams WHERE id = $1 AND is_published = true`,
      [examId]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found or not published' });
    }

    const exam = examResult.rows[0];
    const now = new Date();

    if (exam.start_time && new Date(exam.start_time) > now) {
      return res.status(400).json({ error: 'Exam has not started yet' });
    }
    if (exam.end_time && new Date(exam.end_time) < now) {
      return res.status(400).json({ error: 'Exam has ended' });
    }

    let sessionResult = await query(
      `SELECT * FROM exam_sessions WHERE exam_id = $1 AND student_id = $2`,
      [examId, studentId]
    );

    if (sessionResult.rows.length > 0) {
      const session = sessionResult.rows[0];
      if (['submitted', 'evaluated'].includes(session.status)) {
        return res.status(400).json({ error: 'Exam already completed' });
      }
      if (session.status === 'in_progress' && session.started_at) {
        const elapsedSeconds = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
        const remainingSeconds = Math.max(0, exam.duration_minutes * 60 - elapsedSeconds);
        if (remainingSeconds === 0) {
          await query(`UPDATE exam_sessions SET status = 'expired', time_remaining_seconds = 0 WHERE id = $1`, [session.id]);
          return res.status(400).json({ error: 'Exam time has expired' });
        }
        session.time_remaining_seconds = remainingSeconds;
      }
    }

    const durationSeconds = exam.duration_minutes * 60;

    const existing = sessionResult.rows[0];

    if (!existing) {
      sessionResult = await query(
        `INSERT INTO exam_sessions (exam_id, student_id, status, started_at, time_remaining_seconds)
         VALUES ($1, $2, 'in_progress', NOW(), $3)
         RETURNING *`,
        [examId, studentId, durationSeconds]
      );
    } else if (existing.status !== 'in_progress') {
      sessionResult = await query(
        `UPDATE exam_sessions
         SET status = 'in_progress', started_at = NOW(), time_remaining_seconds = $1
         WHERE exam_id = $2 AND student_id = $3
         RETURNING *`,
        [durationSeconds, examId, studentId]
      );
    }

    const session = sessionResult.rows[0];

    let questionsResult = await query(
      `SELECT q.id, q.question_text, q.question_type, q.points, q.options, eq.order_index
       FROM exam_questions eq
       JOIN questions q ON q.id = eq.question_id
       WHERE eq.exam_id = $1
       ORDER BY eq.order_index`,
      [examId]
    );

    let questions = questionsResult.rows.map((q) => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    }));

    if (exam.shuffle_questions) {
      questions = shuffleArray(questions);
    }

    const answersResult = await query(
      `SELECT question_id, answer_text FROM answers WHERE session_id = $1`,
      [session.id]
    );

    const savedAnswers: Record<string, string> = {};
    answersResult.rows.forEach((a) => {
      savedAnswers[a.question_id] = a.answer_text;
    });

    res.json({
      session,
      exam: {
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.duration_minutes,
        proctoringEnabled: exam.proctoring_enabled,
        totalMarks: exam.total_marks,
      },
      questions,
      savedAnswers,
    });
  } catch (err) {
    console.error('Start session error:', err);
    res.status(500).json({ error: 'Failed to start exam session' });
  }
});

router.post('/:sessionId/answer', authenticate, authorize('student'), async (req, res) => {
  try {
    const { questionId, answerText } = req.body;
    const sessionId = req.params.sessionId;

    const sessionResult = await query(
      `SELECT es.id
       FROM exam_sessions es
       JOIN exams e ON e.id = es.exam_id
       WHERE es.id = $1 AND es.student_id = $2 AND es.status = 'in_progress'
         AND es.started_at + (e.duration_minutes * INTERVAL '1 minute') > NOW()`,
      [sessionId, req.user!.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(400).json({ error: 'No active session found' });
    }

    const answerResult = await query(
      `INSERT INTO answers (session_id, question_id, answer_text)
       SELECT $1, $2, $3
       WHERE EXISTS (
         SELECT 1
         FROM exam_sessions es
         JOIN exam_questions eq ON eq.exam_id = es.exam_id
         WHERE es.id = $1 AND eq.question_id = $2
       )
       ON CONFLICT (session_id, question_id)
       DO UPDATE SET answer_text = EXCLUDED.answer_text, answered_at = NOW()
       RETURNING id`,
      [sessionId, questionId, answerText]
    );

    if (answerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Question does not belong to this exam' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Save answer error:', err);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

router.post('/:sessionId/submit', authenticate, authorize('student'), async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    const sessionResult = await query(
      `SELECT es.*, e.duration_minutes
       FROM exam_sessions es
       JOIN exams e ON e.id = es.exam_id
       WHERE es.id = $1 AND es.student_id = $2 AND es.status = 'in_progress'`,
      [sessionId, req.user!.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(400).json({ error: 'No active session found' });
    }

    const session = sessionResult.rows[0];
    const elapsedSeconds = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
    if (elapsedSeconds >= Number(session.duration_minutes) * 60) {
      await query(`UPDATE exam_sessions SET status = 'expired', time_remaining_seconds = 0 WHERE id = $1`, [sessionId]);
      return res.status(400).json({ error: 'Exam time has expired' });
    }

    await query(
      `UPDATE exam_sessions SET status = 'submitted', submitted_at = NOW() WHERE id = $1`,
      [sessionId]
    );

    const evaluation = await evaluateSession(sessionId);

    res.json({ success: true, ...evaluation });
  } catch (err) {
    console.error('Submit session error:', err);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

router.get('/active', authenticate, authorize('proctor', 'admin', 'instructor'), async (_req, res) => {
  try {
    const result = await query(
      `SELECT es.*, e.title as exam_title, u.full_name as student_name, u.email as student_email
       FROM exam_sessions es
       JOIN exams e ON e.id = es.exam_id
       JOIN users u ON u.id = es.student_id
       WHERE es.status = 'in_progress' AND e.proctoring_enabled = true
       ORDER BY es.started_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Active sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

export default router;
