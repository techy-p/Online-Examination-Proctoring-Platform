import { useEffect, useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/client';
import { QuestionBank, Question } from '../types';

export default function QuestionBanks() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showCreateBank, setShowCreateBank] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [bankForm, setBankForm] = useState({ title: '', description: '', subject: '' });
  const [qForm, setQForm] = useState({
    questionText: '', questionType: 'mcq', points: 1,
    options: ['', '', '', ''], correctAnswer: '', explanation: '',
  });

  useEffect(() => {
    api.get('/question-banks').then((res) => setBanks(res.data));
  }, []);

  const loadQuestions = async (bankId: string) => {
    if (expanded === bankId) {
      setExpanded(null);
      return;
    }
    const { data } = await api.get(`/question-banks/${bankId}/questions`);
    setQuestions(data);
    setExpanded(bankId);
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await api.post('/question-banks', bankForm);
    setBanks([{ ...data, question_count: 0 }, ...banks]);
    setShowCreateBank(false);
    setBankForm({ title: '', description: '', subject: '' });
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expanded) return;
    const options = qForm.questionType === 'short_answer' ? [] : qForm.options.filter(Boolean);
    await api.post(`/question-banks/${expanded}/questions`, {
      ...qForm,
      options,
      correctAnswer: qForm.correctAnswer,
    });
    const { data } = await api.get(`/question-banks/${expanded}/questions`);
    setQuestions(data);
    setShowAddQuestion(false);
    setQForm({
      questionText: '', questionType: 'mcq', points: 1,
      options: ['', '', '', ''], correctAnswer: '', explanation: '',
    });
    setBanks(banks.map((b) => b.id === expanded ? { ...b, question_count: data.length } : b));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Question Banks</h1>
          <p className="text-slate-500 mt-1">Create and manage question repositories</p>
        </div>
        <button onClick={() => setShowCreateBank(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Bank
        </button>
      </div>

      {showCreateBank && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Create Question Bank</h2>
          <form onSubmit={handleCreateBank} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={bankForm.title} onChange={(e) => setBankForm({ ...bankForm, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Subject</label>
              <input className="input" value={bankForm.subject} onChange={(e) => setBankForm({ ...bankForm, subject: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={bankForm.description} onChange={(e) => setBankForm({ ...bankForm, description: e.target.value })} />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-secondary" onClick={() => setShowCreateBank(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {banks.map((bank) => (
          <div key={bank.id} className="card">
            <button
              onClick={() => loadQuestions(bank.id)}
              className="w-full flex items-center justify-between"
            >
              <div className="text-left">
                <h3 className="font-semibold">{bank.title}</h3>
                <p className="text-sm text-slate-500">{bank.subject} &middot; {bank.question_count} questions</p>
              </div>
              {expanded === bank.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {expanded === bank.id && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between mb-4">
                  <h4 className="font-medium">Questions</h4>
                  <button onClick={() => setShowAddQuestion(true)} className="btn-primary text-sm flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Question
                  </button>
                </div>

                {showAddQuestion && (
                  <form onSubmit={handleAddQuestion} className="bg-slate-50 rounded-lg p-4 mb-4 space-y-3">
                    <div>
                      <label className="label">Question</label>
                      <textarea className="input" rows={2} value={qForm.questionText} onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="label">Type</label>
                        <select className="input" value={qForm.questionType} onChange={(e) => setQForm({ ...qForm, questionType: e.target.value })}>
                          <option value="mcq">MCQ</option>
                          <option value="true_false">True/False</option>
                          <option value="short_answer">Short Answer</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Points</label>
                        <input type="number" className="input" value={qForm.points} onChange={(e) => setQForm({ ...qForm, points: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className="label">Correct Answer</label>
                        <input className="input" value={qForm.correctAnswer} onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })} required />
                      </div>
                    </div>
                    {qForm.questionType !== 'short_answer' && (
                      <div className="grid grid-cols-2 gap-2">
                        {qForm.options.map((opt, i) => (
                          <input
                            key={i}
                            className="input"
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const opts = [...qForm.options];
                              opts[i] = e.target.value;
                              setQForm({ ...qForm, options: opts });
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary text-sm">Add</button>
                      <button type="button" className="btn-secondary text-sm" onClick={() => setShowAddQuestion(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <div key={q.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                      <span className="text-slate-400 mr-2">Q{i + 1}.</span>
                      {q.question_text}
                      <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                        {q.question_type} &middot; {q.points}pt
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
