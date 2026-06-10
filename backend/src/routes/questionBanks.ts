import { Router } from 'express';
import { query } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT qb.*, u.full_name as created_by_name,
              (SELECT COUNT(*) FROM questions q WHERE q.bank_id = qb.id) as question_count
       FROM question_banks qb
       LEFT JOIN users u ON u.id = qb.created_by
       ORDER BY qb.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List banks error:', err);
    res.status(500).json({ error: 'Failed to fetch question banks' });
  }
});

router.post('/', authenticate, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const { title, description, subject } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const result = await query(
      `INSERT INTO question_banks (title, description, subject, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, subject, req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create bank error:', err);
    res.status(500).json({ error: 'Failed to create question bank' });
  }
});

router.get('/:id/questions', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, bank_id, question_text, question_type, points, options, explanation, created_at
       FROM questions WHERE bank_id = $1 ORDER BY created_at`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List questions error:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.post('/:id/questions', authenticate, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const { questionText, questionType, points, options, correctAnswer, explanation } = req.body;
    if (!questionText || !correctAnswer) {
      return res.status(400).json({ error: 'Question text and correct answer are required' });
    }

    const result = await query(
      `INSERT INTO questions (bank_id, question_text, question_type, points, options, correct_answer, explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, bank_id, question_text, question_type, points, options, explanation, created_at`,
      [req.params.id, questionText, questionType || 'mcq', points || 1, JSON.stringify(options || []), correctAnswer, explanation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

export default router;
