import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, Users, CheckCircle, TrendingUp, ArrowRight, Shield, BookOpen, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { DashboardStats, Exam } from '../types';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { StatCardSkeleton, TableRowSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

function sessionBadge(status?: string) {
  if (!status) return null;
  const map: Record<string, { variant: 'success' | 'warning' | 'info' | 'default'; label: string }> = {
    evaluated: { variant: 'success', label: 'Completed' },
    in_progress: { variant: 'warning', label: 'In Progress' },
    submitted: { variant: 'info', label: 'Submitted' },
  };
  const b = map[status] || { variant: 'default' as const, label: status };
  return <Badge variant={b.variant}>{b.label}</Badge>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'student') {
          const { data } = await api.get('/exams');
          setExams(data.slice(0, 4));
        } else if (['admin', 'instructor'].includes(user?.role || '')) {
          const [statsRes, examsRes] = await Promise.all([
            api.get('/analytics/dashboard'),
            api.get('/exams'),
          ]);
          setStats(statsRes.data);
          setExams(examsRes.data.slice(0, 5));
        } else if (user?.role === 'proctor') {
          setExams([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ')[0];

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description={
          user?.role === 'student'
            ? 'Track your exams, monitor progress, and view your results.'
            : user?.role === 'proctor'
            ? 'Monitor live exam sessions and ensure exam integrity.'
            : 'Manage examinations, question banks, and analyze student performance.'
        }
        badge={<Badge variant="brand" className="capitalize">{user?.role}</Badge>}
      />

      {['admin', 'instructor'].includes(user?.role || '') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : stats ? (
            <>
              <StatCard label="Total Exams" value={stats.totalExams} icon={ClipboardList} color="brand" />
              <StatCard label="Students" value={stats.totalStudents} icon={Users} color="violet" />
              <StatCard label="Completed" value={stats.completedSessions} icon={CheckCircle} color="emerald" />
              <StatCard label="Average Score" value={`${stats.averageScore}%`} icon={TrendingUp} color="amber" />
            </>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {user?.role === 'student' && (
          <>
            <Link to="/exams" className="card hover:shadow-md hover:border-brand-200/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold">Available Exams</h3>
              <p className="text-sm text-slate-500 mt-1">Take your scheduled examinations</p>
              <ArrowRight className="w-4 h-4 text-brand-600 mt-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/results" className="card hover:shadow-md hover:border-emerald-200/60 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold">My Results</h3>
              <p className="text-sm text-slate-500 mt-1">View scores and performance history</p>
              <ArrowRight className="w-4 h-4 text-emerald-600 mt-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </>
        )}

        {user?.role === 'proctor' && (
          <Link to="/proctor" className="card md:col-span-2 hover:shadow-md hover:border-red-200/60 transition-all flex items-center gap-5 group">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
              <Shield className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-lg">Live Proctoring</h3>
              <p className="text-slate-500 text-sm">Monitor active sessions via WebRTC</p>
            </div>
            <Badge variant="danger" dot>Live</Badge>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {['admin', 'instructor'].includes(user?.role || '') && (
          <>
            <Link to="/exams" className="card hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Exams</h3>
                <p className="text-sm text-slate-500">Create & publish</p>
              </div>
            </Link>
            <Link to="/question-banks" className="card hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Question Banks</h3>
                <p className="text-sm text-slate-500">Build repositories</p>
              </div>
            </Link>
            <Link to="/analytics" className="card hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-slate-500">Insights & reports</p>
              </div>
            </Link>
          </>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-lg">
            {user?.role === 'student' ? 'Your Exams' : 'Recent Exams'}
          </h2>
          <Link to="/exams" className="text-sm text-brand-600 font-medium hover:text-brand-700">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="divide-y">
            {Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} />)}
          </div>
        ) : exams.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No exams yet"
            description={user?.role === 'student' ? 'Check back later for published examinations.' : 'Create your first exam to get started.'}
            action={['admin', 'instructor'].includes(user?.role || '') ? (
              <Link to="/exams" className="btn-primary text-sm">Create Exam</Link>
            ) : undefined}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {exams.map((exam) => (
              <div key={exam.id} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900">{exam.title}</p>
                    {sessionBadge(exam.session_status)}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {exam.duration_minutes} min · {exam.total_marks} marks
                    {exam.proctoring_enabled && <span className="text-red-500 ml-2">· Proctored</span>}
                  </p>
                </div>
                {user?.role === 'student' && exam.session_status !== 'evaluated' && (
                  <Link to={`/exam/${exam.id}/take`} className="btn-primary text-sm flex-shrink-0">
                    {exam.session_status === 'in_progress' ? 'Resume' : 'Start'}
                  </Link>
                )}
                {user?.role === 'student' && exam.session_status === 'evaluated' && (
                  <span className="text-sm font-semibold text-emerald-600">{Number(exam.percentage).toFixed(0)}%</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
