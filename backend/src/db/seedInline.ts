import bcrypt from 'bcryptjs';
import { PGlite } from '@electric-sql/pglite';

export default async function runSeed(db: PGlite) {
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const users = [
    { email: 'admin@invigilo.app', name: 'Priyanshu Gupta', role: 'admin' },
    { email: 'instructor@invigilo.app', name: 'Dr. Sarah Chen', role: 'instructor' },
    { email: 'proctor@invigilo.app', name: 'James Wilson', role: 'proctor' },
    { email: 'student@invigilo.app', name: 'Alex Johnson', role: 'student' },
    { email: 'student2@invigilo.app', name: 'Maria Garcia', role: 'student' },
  ];

  const userIds: Record<string, string> = {};

  for (const u of users) {
    const result = await db.query<{ id: string; email: string }>(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email`,
      [u.email, passwordHash, u.name, u.role]
    );
    userIds[u.email] = result.rows[0].id;
  }

  const bankResult = await db.query<{ id: string }>(
    `INSERT INTO question_banks (title, description, subject, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      'Computer Science Fundamentals',
      'Core CS concepts including algorithms, data structures, and programming',
      'Computer Science',
      userIds['instructor@invigilo.app'],
    ]
  );
  const bankId = bankResult.rows[0].id;

  const questions = [
    { text: 'What is the time complexity of binary search?', type: 'mcq', points: 2, options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], answer: 'O(log n)' },
    { text: 'Which data structure uses LIFO principle?', type: 'mcq', points: 2, options: ['Queue', 'Stack', 'Tree', 'Graph'], answer: 'Stack' },
    { text: 'JavaScript is a statically typed language.', type: 'true_false', points: 1, options: ['True', 'False'], answer: 'False' },
    { text: 'What does SQL stand for?', type: 'short_answer', points: 2, options: [], answer: 'structured query language|sql' },
    { text: 'Which HTTP method is used to create a new resource?', type: 'mcq', points: 2, options: ['GET', 'POST', 'PUT', 'DELETE'], answer: 'POST' },
    { text: 'React uses a virtual DOM for performance optimization.', type: 'true_false', points: 1, options: ['True', 'False'], answer: 'True' },
    { text: 'What is the default port for PostgreSQL?', type: 'mcq', points: 2, options: ['3306', '5432', '27017', '8080'], answer: '5432' },
    { text: 'Node.js is single-threaded by default.', type: 'true_false', points: 1, options: ['True', 'False'], answer: 'True' },
    { text: 'What protocol does WebRTC primarily use?', type: 'mcq', points: 2, options: ['HTTP', 'FTP', 'UDP/RTP', 'SMTP'], answer: 'UDP/RTP' },
    { text: 'REST stands for Representational State Transfer.', type: 'true_false', points: 1, options: ['True', 'False'], answer: 'True' },
  ];

  for (const q of questions) {
    await db.query(
      `INSERT INTO questions (bank_id, question_text, question_type, points, options, correct_answer)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [bankId, q.text, q.type, q.points, JSON.stringify(q.options), q.answer]
    );
  }

  const examResult = await db.query<{ id: string }>(
    `INSERT INTO exams (title, description, bank_id, created_by, duration_minutes, total_marks, passing_marks, is_published, proctoring_enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true, true)
     RETURNING id`,
    ['CS Fundamentals Mid-Term Exam', 'Comprehensive CS fundamentals assessment', bankId, userIds['instructor@invigilo.app'], 30, 100, 50]
  );
  const examId = examResult.rows[0].id;

  await db.query(
    `INSERT INTO exam_questions (exam_id, question_id, order_index)
     SELECT $1, id, ROW_NUMBER() OVER (ORDER BY created_at) - 1
     FROM questions WHERE bank_id = $2`,
    [examId, bankId]
  );
}
