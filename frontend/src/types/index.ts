export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'instructor' | 'student' | 'proctor';
}

export interface QuestionBank {
  id: string;
  title: string;
  description: string;
  subject: string;
  question_count: number;
  created_by_name: string;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer';
  points: number;
  options: string[];
  order_index?: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  bank_id: string;
  bank_title: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  proctoring_enabled: boolean;
  is_published: boolean;
  session_status?: string;
  score?: number;
  percentage?: number;
  passed?: boolean;
  enrollment_count?: number;
  completed_count?: number;
}

export interface ExamSession {
  id: string;
  exam_id: string;
  student_id: string;
  status: string;
  started_at: string;
  time_remaining_seconds: number;
  score?: number;
  percentage?: number;
  passed?: boolean;
  exam_title?: string;
  student_name?: string;
}

export interface DashboardStats {
  totalExams: number;
  totalStudents: number;
  completedSessions: number;
  averageScore: string;
}
