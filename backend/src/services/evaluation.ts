import { query } from '../db';

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

function evaluateAnswer(
  questionType: string,
  correctAnswer: string,
  studentAnswer: string | null
): boolean {
  if (!studentAnswer) return false;

  const normalized = normalizeAnswer(studentAnswer);
  const correct = normalizeAnswer(correctAnswer);

  if (questionType === 'mcq' || questionType === 'true_false') {
    return normalized === correct;
  }

  if (questionType === 'short_answer') {
    const acceptable = correct.split('|').map((a) => a.trim().toLowerCase());
    return acceptable.some((a) => normalized.includes(a) || a.includes(normalized));
  }

  return false;
}

export async function evaluateSession(sessionId: string) {
  const answersResult = await query(
    `SELECT a.id, a.answer_text, q.question_type, q.correct_answer, q.points
     FROM exam_sessions es
     JOIN exam_questions eq ON eq.exam_id = es.exam_id
     JOIN questions q ON q.id = eq.question_id
     LEFT JOIN answers a ON a.question_id = q.id AND a.session_id = es.id
     WHERE es.id = $1`,
    [sessionId]
  );

  let totalScore = 0;
  let maxScore = 0;

  for (const row of answersResult.rows) {
    maxScore += Number(row.points);
    const isCorrect = evaluateAnswer(row.question_type, row.correct_answer, row.answer_text);
    const pointsAwarded = isCorrect ? Number(row.points) : 0;
    totalScore += pointsAwarded;

    if (row.id) {
      await query(
        `UPDATE answers SET is_correct = $1, points_awarded = $2 WHERE id = $3`,
        [isCorrect, pointsAwarded, row.id]
      );
    }
  }

  const examResult = await query(
    `SELECT e.total_marks, e.passing_marks
     FROM exam_sessions es
     JOIN exams e ON e.id = es.exam_id
     WHERE es.id = $1`,
    [sessionId]
  );

  const exam = examResult.rows[0];
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const scaledScore = maxScore > 0 ? (totalScore / maxScore) * Number(exam.total_marks) : 0;
  const passed = scaledScore >= Number(exam.passing_marks);

  await query(
    `UPDATE exam_sessions
     SET status = 'evaluated', score = $1, percentage = $2, passed = $3
     WHERE id = $4`,
    [scaledScore.toFixed(2), percentage.toFixed(2), passed, sessionId]
  );

  return { score: scaledScore, percentage, passed, maxScore, totalScore };
}
