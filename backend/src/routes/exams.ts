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

    const duration = Number(durationMinutes || 60);
    const total = Number(totalMarks || 100);
    const passing = Number(passingMarks || 40);

    if (!Number.isFinite(duration) || duration < 1 || !Number.isFinite(total) || total < 1) {
      return res.status(400).json({ error: 'Duration and total marks must be positive numbers' });
    }
    if (!Number.isFinite(passing) || passing < 0 || passing > total) {
      return res.status(400).json({ error: 'Passing marks must be between 0 and total marks' });
    }

    const bankResult = await query(
      `SELECT qb.id, COUNT(q.id) as question_count
       FROM question_banks qb
       LEFT JOIN questions q ON q.bank_id = qb.id
       WHERE qb.id = $1
       GROUP BY qb.id`,
      [bankId]
    );
    if (bankResult.rows.length === 0) {
      return res.status(400).json({ error: 'Question bank not found' });
    }
    if (Number(bankResult.rows[0].question_count) === 0) {
      return res.status(400).json({ error: 'Add at least one question to the bank before creating an exam' });
    }

    const result = await query(
      `INSERT INTO exams (title, description, bank_id, created_by, duration_minutes, total_marks,
                          passing_marks, shuffle_questions, proctoring_enabled, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        title, description, bankId, req.user!.id,
        duration, total, passing,
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
      `UPDATE exams
       SET is_published = true, updated_at = NOW()
       WHERE id = $1
         AND EXISTS (SELECT 1 FROM exam_questions WHERE exam_id = $1)
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Exam not found or has no questions' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Publish exam error:', err);
    res.status(500).json({ error: 'Failed to publish exam' });
  }
});

export default router;
