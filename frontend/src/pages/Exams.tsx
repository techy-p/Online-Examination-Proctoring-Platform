import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock, Users, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { Exam, QuestionBank } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import FormField from '../components/ui/FormField';
import { TableRowSkeleton } from '../components/ui/Skeleton';

export default function Exams() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', bankId: '', durationMinutes: 60, totalMarks: 100, passingMarks: 40,
  });

  const isInstructor = ['admin', 'instructor'].includes(user?.role || '');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const examsRes = await api.get('/exams');
        setExams(examsRes.data);
        if (isInstructor) {
          const banksRes = await api.get('/question-banks');
          setBanks(banksRes.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isInstructor]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/exams', form);
      setExams([data, ...exams]);
      setShowCreate(false);
      setForm({ title: '', description: '', bankId: '', durationMinutes: 60, totalMarks: 100, passingMarks: 40 });
      success('Exam created', 'You can publish it when ready.');
    } catch {
      toastError('Failed to create exam');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (examId: string) => {
    setPublishing(examId);
    try {
      const { data } = await api.patch(`/exams/${examId}/publish`);
      setExams(exams.map((e) => (e.id === examId ? data : e)));
      success('Exam published', 'Students can now take this exam.');
    } catch {
      toastError('Failed to publish exam');
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={isInstructor ? 'Exam Management' : 'My Exams'}
        description={isInstructor ? 'Create, configure, and publish examination sessions.' : 'View and take your assigned examinations.'}
        action={isInstructor ? (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Exam
          </button>
        ) : undefined}
      />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Exam"
        description="Configure exam settings and link a question bank."
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" form="create-exam-form" className="btn-primary flex items-center gap-2" disabled={creating}>
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Exam
            </button>
          </>
        }
      >
        <form id="create-exam-form" onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormField label="Title">
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="CS Fundamentals Mid-Term" />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField label="Description">
              <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief exam description..." />
            </FormField>
          </div>
          <FormField label="Question Bank">
            <select className="input" value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })} required>
              <option value="">Select a bank</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.title} ({b.question_count} questions)</option>
              ))}
            </select>
          </FormField>
          <FormField label="Duration (minutes)">
            <input type="number" className="input" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
          </FormField>
          <FormField label="Total Marks">
            <input type="number" className="input" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: Number(e.target.value) })} />
          </FormField>
          <FormField label="Passing Marks">
            <input type="number" className="input" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })} />
          </FormField>
        </form>
      </Modal>

      {loading ? (
        <div className="card divide-y">
          {Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)}
        </div>
      ) : exams.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No exams found"
          description={isInstructor ? 'Create your first exam to get started.' : 'No published exams are available right now.'}
          action={isInstructor ? <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">Create Exam</button> : undefined}
        />
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="card hover:shadow-md hover:border-brand-200/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-lg">{exam.title}</h3>
                    <Badge variant={exam.is_published ? 'success' : 'warning'}>
                      {exam.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    {exam.proctoring_enabled && (
                      <Badge variant="danger" dot>Proctored</Badge>
                    )}
                  </div>
                  {exam.description && <p className="text-slate-500 text-sm mt-1 line-clamp-2">{exam.description}</p>}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.duration_minutes} min</span>
                    <span>{exam.total_marks} marks · Pass: {exam.passing_marks}</span>
                    {isInstructor && (
                      <>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {exam.enrollment_count || 0}</span>
                        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> {exam.completed_count || 0} done</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {isInstructor && !exam.is_published && (
                    <button
                      onClick={() => handlePublish(exam.id)}
                      className="btn-primary text-sm flex items-center gap-1.5"
                      disabled={publishing === exam.id}
                    >
                      {publishing === exam.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Publish
                    </button>
                  )}
                  {isInstructor && (
                    <Link to={`/analytics?exam=${exam.id}`} className="btn-secondary text-sm">Analytics</Link>
                  )}
                  {user?.role === 'student' && exam.session_status !== 'evaluated' && (
                    <Link to={`/exam/${exam.id}/take`} className="btn-primary text-sm">
                      {exam.session_status === 'in_progress' ? 'Resume' : 'Start Exam'}
                    </Link>
                  )}
                  {user?.role === 'student' && exam.session_status === 'evaluated' && (
                    <span className="text-sm font-semibold text-emerald-600 self-center">{Number(exam.percentage).toFixed(0)}%</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
