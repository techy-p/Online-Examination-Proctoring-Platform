import { Router } from 'express';
import { query } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, authorize('admin', 'instructor'), async (_req, res) => {
  try {
    const [exams, students, sessions, avgScore] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM exams`),
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`),
      query(`SELECT COUNT(*) as count FROM exam_sessions WHERE status = 'evaluated'`),
      query(`SELECT COALESCE(AVG(percentage), 0) as avg FROM exam_sessions WHERE status = 'evaluated'`),
    ]);

    res.json({
      totalExams: Number(exams.rows[0].count),
      totalStudents: Number(students.rows[0].count),
      completedSessions: Number(sessions.rows[0].count),
      averageScore: Number(avgScore.rows[0].avg).toFixed(1),
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/exam/:examId', authenticate, authorize('admin', 'instructor'), async (req, res) => {
  try {
    const examId = req.params.examId;

    const [examInfo, scoreDistribution, topPerformers, proctoringSummary] = await Promise.all([
      query(
        `SELECT e.title, e.total_marks, e.passing_marks,
                COUNT(es.id) as total_attempts,
                COUNT(CASE WHEN es.status = 'evaluated' THEN 1 END) as completed,
                COALESCE(AVG(es.percentage), 0) as avg_percentage,
                COUNT(CASE WHEN es.passed = true THEN 1 END) as passed_count
         FROM exams e
         LEFT JOIN exam_sessions es ON es.exam_id = e.id
         WHERE e.id = $1
         GROUP BY e.id, e.title, e.total_marks, e.passing_marks`,
        [examId]
      ),
      query(
        `SELECT
           CASE
             WHEN percentage >= 90 THEN '90-100%'
             WHEN percentage >= 75 THEN '75-89%'
             WHEN percentage >= 60 THEN '60-74%'
             WHEN percentage >= 40 THEN '40-59%'
             ELSE 'Below 40%'
           END as range,
           COUNT(*) as count
         FROM exam_sessions
         WHERE exam_id = $1 AND status = 'evaluated'
         GROUP BY 1
         ORDER BY 1`,
        [examId]
      ),
      query(
        `SELECT u.full_name, es.score, es.percentage, es.passed, es.submitted_at
         FROM exam_sessions es
         JOIN users u ON u.id = es.student_id
         WHERE es.exam_id = $1 AND es.status = 'evaluated'
         ORDER BY es.percentage DESC
         LIMIT 10`,
        [examId]
      ),
      query(
        `SELECT pe.event_type, COUNT(*) as count
         FROM proctoring_events pe
         JOIN exam_sessions es ON es.id = pe.session_id
         WHERE es.exam_id = $1
         GROUP BY pe.event_type
         ORDER BY count DESC`,
        [examId]
      ),
    ]);

    res.json({
      overview: examInfo.rows[0],
      scoreDistribution: scoreDistribution.rows,
      topPerformers: topPerformers.rows,
      proctoringSummary: proctoringSummary.rows,
    });
  } catch (err) {
    console.error('Exam analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch exam analytics' });
  }
});

router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (req.user!.role === 'student' && req.user!.id !== studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `SELECT es.*, e.title as exam_title, e.total_marks, e.passing_marks
       FROM exam_sessions es
       JOIN exams e ON e.id = es.exam_id
       WHERE es.student_id = $1 AND es.status IN ('evaluated', 'submitted')
       ORDER BY es.submitted_at DESC`,
      [studentId]
    );

    const stats = await query(
      `SELECT
         COUNT(*) as total_exams,
         COALESCE(AVG(percentage), 0) as avg_percentage,
         COUNT(CASE WHEN passed = true THEN 1 END) as passed_count
       FROM exam_sessions
       WHERE student_id = $1 AND status = 'evaluated'`,
      [studentId]
    );

    res.json({
      sessions: result.rows,
      stats: stats.rows[0],
    });
  } catch (err) {
    console.error('Student analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch student analytics' });
  }
});

export default router;
