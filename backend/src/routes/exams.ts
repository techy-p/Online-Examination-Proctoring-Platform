import { Router } from 'express';
import { query } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { role, id } = req.user!;

    if (role === 'student') {
      const result = await query(
        `SELECT e.*, qb.title as bank_title,
                es.status as session_status, es.score, es.percentage, es.passed
         FROM exams e
         LEFT JOIN question_banks qb ON qb.id = e.bank_id
         LEFT JOIN exam_sessions es ON es.exam_id = e.id AND es.student_id = $1
         WHERE e.is_published = true
         ORDER BY e.start_time DESC NULLS LAST`,
        [id]
      );
      return res.json(result.rows);
    }

    const result = await query(
      `SELECT e.*, qb.title as bank_title,
              (SELECT COUNT(*) FROM exam_enrollments ee WHERE ee.exam_id = e.id) as enrollment_count,
              (SELECT COUNT(*) FROM exam_sessions es WHERE es.exam_id = e.id AND es.status = 'evaluated') as completed_count
       FROM exams e
       LEFT JOIN question_banks qb ON qb.id = e.bank_id
       ORDER BY e.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List exams error:', err);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT e.*, qb.title as bank_title, u.full_name as created_by_name
       FROM exams e
       LEFT JOIN question_banks qb ON qb.id = e.bank_id
       LEFT JOIN users u ON u.id = e.created_by
       WHERE e.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get exam error:', err);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

router.post('/', authenticate, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const {
      title, description, bankId, durationMinutes, totalMarks, passingMarks,
      shuffleQuestions, proctoringEnabled, startTime, endTime,
    } = req.body;

    if (!title || !bankId) {
      return res.status(400).json({ error: 'Title and question bank are required' });
    }

    const result = await query(
      `INSERT INTO exams (title, description, bank_id, created_by, duration_minutes, total_marks,
                          passing_marks, shuffle_questions, proctoring_enabled, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        title, description, bankId, req.user!.id,
        durationMinutes || 60, totalMarks || 100, passingMarks || 40,
        shuffleQuestions ?? true, proctoringEnabled ?? true,
        startTime || null, endTime || null,
      ]
    );

    const exam = result.rows[0];

    await query(
      `INSERT INTO exam_questions (exam_id, question_id, order_index)
       SELECT $1, id, ROW_NUMBER() OVER (ORDER BY created_at) - 1
       FROM questions WHERE bank_id = $2`,
      [exam.id, bankId]
    );

    res.status(201).json(exam);
  } catch (err) {
    console.error('Create exam error:', err);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

router.patch('/:id/publish', authenticate, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const result = await query(
      `UPDATE exams SET is_published = true, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Publish exam error:', err);
    res.status(500).json({ error: 'Failed to publish exam' });
  }
});

export default router;
