import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Trophy, XCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

interface SessionResult {
  id: string;
  exam_title: string;
  score: number;
  percentage: number;
  passed: boolean;
  submitted_at: string;
  total_marks: number;
  passing_marks: number;
}

export default function Results() {
  const { user } = useAuth();
  const location = useLocation();
  const justSubmitted = location.state as { result?: { score: number; percentage: number; passed: boolean }; examTitle?: string } | null;

  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [stats, setStats] = useState<{ total_exams: number; avg_percentage: number; passed_count: number } | null>(null);

  useEffect(() => {
    if (user) {
      api.get(`/analytics/student/${user.id}`).then((res) => {
        setSessions(res.data.sessions);
        setStats(res.data.stats);
      });
    }
  }, [user]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Results</h1>
        <p className="text-slate-500 mt-1">Track your exam performance and scores</p>
      </div>

      {justSubmitted?.result && (
        <div className={`card mb-8 text-center ${justSubmitted.result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {justSubmitted.result.passed ? (
            <Trophy className="w-12 h-12 text-green-600 mx-auto mb-3" />
          ) : (
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          )}
          <h2 className="text-xl font-bold mb-1">
            {justSubmitted.result.passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h2>
          <p className="text-slate-600 mb-4">{justSubmitted.examTitle}</p>
          <p className="text-4xl font-bold">{Number(justSubmitted.result.percentage).toFixed(1)}%</p>
          <p className="text-sm text-slate-500 mt-2">Score: {justSubmitted.result.score}</p>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-2xl font-bold">{stats.total_exams}</p>
            <p className="text-sm text-slate-500">Exams Taken</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold">{Number(stats.avg_percentage).toFixed(1)}%</p>
            <p className="text-sm text-slate-500">Average Score</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{stats.passed_count}</p>
            <p className="text-sm text-slate-500">Passed</p>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Exam History
        </h2>
        {sessions.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No exam results yet</p>
        ) : (
          <div className="divide-y">
            {sessions.map((s) => (
              <div key={s.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.exam_title}</p>
                  <p className="text-sm text-slate-500">
                    Submitted {new Date(s.submitted_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{Number(s.percentage).toFixed(1)}%</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    s.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {s.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
