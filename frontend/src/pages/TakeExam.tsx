import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Send, Video, Loader2 } from 'lucide-react';
import api from '../api/client';
import { Question } from '../types';
import ExamTimer from '../components/ExamTimer';
import Modal from '../components/ui/Modal';
import { useWebRTC } from '../hooks/useWebRTC';
import { useToast } from '../context/ToastContext';

interface ExamData {
  session: { id: string; time_remaining_seconds: number };
  exam: { title: string; durationMinutes: number; proctoringEnabled: boolean; totalMarks: number };
  questions: Question[];
  savedAnswers: Record<string, string>;
}

export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ExamData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [alerts, setAlerts] = useState<string[]>([]);
  const tabSwitchCount = useRef(0);
  const { error: toastError } = useToast();

  const proctoringEnabled = data?.exam.proctoringEnabled ?? false;
  const { localVideoRef } = useWebRTC({
    sessionId: data?.session.id || '',
    isInitiator: true,
    enabled: proctoringEnabled && !!data?.session.id,
  });

  useEffect(() => {
    api.post(`/sessions/start/${examId}`).then((res) => {
      setData(res.data);
      setAnswers(res.data.savedAnswers || {});
    }).catch((err) => {
      setLoadError(err.response?.data?.error || 'Failed to start exam');
      toastError('Cannot start exam', err.response?.data?.error);
    });
  }, [examId, navigate]);

  useEffect(() => {
    if (!proctoringEnabled) return;

    const handleVisibility = () => {
      if (document.hidden && data?.session.id) {
        tabSwitchCount.current += 1;
        const msg = `Tab switch detected (${tabSwitchCount.current})`;
        setAlerts((a) => [...a, msg]);
        api.post('/proctoring/events', {
          sessionId: data.session.id,
          eventType: 'tab_switch',
          description: msg,
          severity: tabSwitchCount.current > 2 ? 'high' : 'medium',
        });
      }
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement && data?.session.id) {
        api.post('/proctoring/events', {
          sessionId: data.session.id,
          eventType: 'fullscreen_exit',
          description: 'Exited fullscreen mode',
          severity: 'medium',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);

    document.documentElement.requestFullscreen?.().catch(() => {});

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, [proctoringEnabled, data?.session.id]);

  const saveAnswer = useCallback(async (questionId: string, answerText: string) => {
    if (!data) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answerText }));
    await api.post(`/sessions/${data.session.id}/answer`, { questionId, answerText });
  }, [data]);

  const handleSubmit = useCallback(async () => {
    if (!data || submitting) return;
    setSubmitting(true);
    try {
      const result = await api.post(`/sessions/${data.session.id}/submit`);
      navigate('/results', { state: { result: result.data, examTitle: data.exam.title } });
    } catch {
      toastError('Submission failed', 'Please try again.');
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  }, [data, submitting, navigate, toastError]);

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-red-600 font-medium">{loadError}</p>
        <button onClick={() => navigate('/exams')} className="btn-primary">Back to Exams</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-sm text-slate-500">Preparing your exam session...</p>
      </div>
    );
  }

  const question = data.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-semibold">{data.exam.title}</h1>
          <p className="text-sm text-slate-500">
            Question {currentIndex + 1} of {data.questions.length} &middot; {answeredCount} answered
          </p>
        </div>
        <div className="flex items-center gap-4">
          {proctoringEnabled && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <Shield className="w-4 h-4" />
              <span>Proctored</span>
            </div>
          )}
          <ExamTimer
            initialSeconds={data.session.time_remaining_seconds}
            onExpire={handleSubmit}
          />
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {alerts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                {alerts.slice(-3).map((a, i) => <p key={i}>{a}</p>)}
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium uppercase tracking-wide text-primary-600 bg-primary-50 px-2 py-1 rounded">
                {question.question_type.replace('_', ' ')} &middot; {question.points} points
              </span>
            </div>
            <h2 className="text-lg font-medium mb-6">{question.question_text}</h2>

            {question.question_type === 'short_answer' ? (
              <textarea
                className="input"
                rows={4}
                value={answers[question.id] || ''}
                onChange={(e) => saveAnswer(question.id, e.target.value)}
                placeholder="Type your answer..."
              />
            ) : (
              <div className="space-y-3">
                {(question.options || []).map((opt, i) => (
                  <label
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[question.id] === opt
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === opt}
                      onChange={() => saveAnswer(question.id, opt)}
                      className="text-primary-600"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              className="btn-secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
            >
              Previous
            </button>
            {currentIndex < data.questions.length - 1 ? (
              <button className="btn-primary" onClick={() => setCurrentIndex(currentIndex + 1)}>
                Next
              </button>
            ) : (
              <button className="btn-primary flex items-center gap-2" onClick={() => setShowSubmitModal(true)} disabled={submitting}>
                <Send className="w-4 h-4" />
                Submit Exam
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {proctoringEnabled && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium">
                <Video className="w-4 h-4 text-red-500" />
                Webcam Feed
              </div>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full rounded-lg bg-slate-900 aspect-video object-cover"
              />
              <p className="text-xs text-slate-500 mt-2">Your webcam is being monitored</p>
            </div>
          )}

          <div className="card">
            <h3 className="font-medium mb-3 text-sm">Question Navigator</h3>
            <div className="grid grid-cols-5 gap-2">
              {data.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    i === currentIndex
                      ? 'bg-primary-600 text-white'
                      : answers[q.id]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              className="btn-primary w-full mt-4 text-sm flex items-center justify-center gap-2"
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
            >
              <Send className="w-4 h-4" />
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={showSubmitModal}
        onClose={() => !submitting && setShowSubmitModal(false)}
        title="Submit Exam?"
        description={`You have answered ${answeredCount} of ${data.questions.length} questions. This action cannot be undone.`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setShowSubmitModal(false)} disabled={submitting}>Keep working</button>
            <button className="btn-primary flex items-center gap-2" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit now'}
            </button>
          </>
        }
      >
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
          Make sure you have reviewed all answers before submitting.
        </div>
      </Modal>
    </div>
  );
}
