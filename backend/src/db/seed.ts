import bcrypt from 'bcryptjs';
import { initDatabase, query, closeDatabase } from './index';

async function seed() {
  try {
    await initDatabase();
    console.log('Seeding database...');

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
      const result = await query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET full_name = $3, password_hash = $2
         RETURNING id, email`,
        [u.email, passwordHash, u.name, u.role]
      );
      userIds[u.email] = result.rows[0].id;
    }

    let bankId: string;
    const existingBank = await query(`SELECT id FROM question_banks WHERE title = $1`, [
      'Computer Science Fundamentals',
    ]);

    if (existingBank.rows.length > 0) {
      bankId = existingBank.rows[0].id;
    } else {
      const bankResult = await query(
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
      bankId = bankResult.rows[0].id;
    }

    const questions = [
      {
        text: 'What is the time complexity of binary search?',
        type: 'mcq',
        points: 2,
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        answer: 'O(log n)',
        explanation: 'Binary search halves the search space each iteration.',
      },
      {
        text: 'Which data structure uses LIFO principle?',
        type: 'mcq',
        points: 2,
        options: ['Queue', 'Stack', 'Tree', 'Graph'],
        answer: 'Stack',
        explanation: 'Stack follows Last In, First Out.',
      },
      {
        text: 'JavaScript is a statically typed language.',
        type: 'true_false',
        points: 1,
        options: ['True', 'False'],
        answer: 'False',
        explanation: 'JavaScript is dynamically typed.',
      },
      {
        text: 'What does SQL stand for?',
        type: 'short_answer',
        points: 2,
        options: [],
        answer: 'structured query language|sql',
        explanation: 'SQL = Structured Query Language.',
      },
      {
        text: 'Which HTTP method is used to create a new resource?',
        type: 'mcq',
        points: 2,
        options: ['GET', 'POST', 'PUT', 'DELETE'],
        answer: 'POST',
        explanation: 'POST is used to create new resources.',
      },
      {
        text: 'React uses a virtual DOM for performance optimization.',
        type: 'true_false',
        points: 1,
        options: ['True', 'False'],
        answer: 'True',
        explanation: 'React uses Virtual DOM to minimize direct DOM manipulation.',
      },
      {
        text: 'What is the default port for PostgreSQL?',
        type: 'mcq',
        points: 2,
        options: ['3306', '5432', '27017', '8080'],
        answer: '5432',
        explanation: 'PostgreSQL default port is 5432.',
      },
      {
        text: 'Node.js is single-threaded by default.',
        type: 'true_false',
        points: 1,
        options: ['True', 'False'],
        answer: 'True',
        explanation: 'Node.js uses a single-threaded event loop.',
      },
      {
        text: 'What protocol does WebRTC primarily use for real-time communication?',
        type: 'mcq',
        points: 2,
        options: ['HTTP', 'FTP', 'UDP/RTP', 'SMTP'],
        answer: 'UDP/RTP',
        explanation: 'WebRTC uses UDP with RTP for media streams.',
      },
      {
        text: 'REST stands for Representational State Transfer.',
        type: 'true_false',
        points: 1,
        options: ['True', 'False'],
        answer: 'True',
        explanation: 'REST is an architectural style for web services.',
      },
    ];

    for (const q of questions) {
      await query(
        `INSERT INTO questions (bank_id, question_text, question_type, points, options, correct_answer, explanation)
         SELECT $1, $2, $3, $4, $5, $6, $7
         WHERE NOT EXISTS (
           SELECT 1 FROM questions WHERE bank_id = $1 AND question_text = $2
         )`,
        [bankId, q.text, q.type, q.points, JSON.stringify(q.options), q.answer, q.explanation]
      );
    }

    let examId: string;
    const existingExam = await query(`SELECT id FROM exams WHERE title = $1`, [
      'CS Fundamentals Mid-Term Exam',
    ]);

    if (existingExam.rows.length > 0) {
      examId = existingExam.rows[0].id;
    } else {
      const examResult = await query(
        `INSERT INTO exams (title, description, bank_id, created_by, duration_minutes, total_marks, passing_marks, is_published, proctoring_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, true)
         RETURNING id`,
        [
          'CS Fundamentals Mid-Term Exam',
          'Comprehensive assessment of computer science fundamentals',
          bankId,
          userIds['instructor@invigilo.app'],
          30,
          100,
          50,
        ]
      );
      examId = examResult.rows[0].id;
    }

    const existingLinks = await query(
      `SELECT COUNT(*) as count FROM exam_questions WHERE exam_id = $1`,
      [examId]
    );

    if (Number(existingLinks.rows[0].count) === 0) {
      await query(
        `INSERT INTO exam_questions (exam_id, question_id, order_index)
         SELECT $1, id, ROW_NUMBER() OVER (ORDER BY created_at) - 1
         FROM questions WHERE bank_id = $2`,
        [examId, bankId]
      );
    }

    console.log('Seed completed successfully!');
    console.log('\nDemo accounts (password: Password123!):');
    users.forEach((u) => console.log(`  ${u.role.padEnd(12)} ${u.email}`));
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

seed();
