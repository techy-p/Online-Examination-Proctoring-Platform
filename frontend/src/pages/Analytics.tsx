import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import api from '../api/client';
import { Exam } from '../types';

const COLORS = ['#326455', '#b69358', '#7b8f88', '#b4534b', '#66746f'];

interface ExamAnalytics {
  overview: {
    title: string;
    total_attempts: number;
    completed: number;
    avg_percentage: number;
    passed_count: number;
    passing_marks: number;
  };
  scoreDistribution: { range: string; count: number }[];
  topPerformers: { full_name: string; percentage: number; passed: boolean }[];
  proctoringSummary: { event_type: string; count: number }[];
}

export default function Analytics() {
  const [searchParams] = useSearchParams();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState(searchParams.get('exam') || '');
  const [analytics, setAnalytics] = useState<ExamAnalytics | null>(null);
  const [dashboard, setDashboard] = useState<Record<string, string | number> | null>(null);

  useEffect(() => {
    api.get('/exams').then((res) => setExams(res.data));
    api.get('/analytics/dashboard').then((res) => setDashboard(res.data));
  }, []);

  useEffect(() => {
    if (selectedExam) {
      api.get(`/analytics/exam/${selectedExam}`).then((res) => setAnalytics(res.data));
    }
  }, [selectedExam]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Result Analytics</h1>
        <p className="text-slate-500 mt-1">Exam performance insights and proctoring reports</p>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Exams', value: dashboard.totalExams },
            { label: 'Students', value: dashboard.totalStudents },
            { label: 'Completed', value: dashboard.completedSessions },
            { label: 'Avg Score', value: `${dashboard.averageScore}%` },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <p className="font-display text-3xl font-semibold text-brand-950">{value}</p>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500 mt-2">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-6">
        <label className="label">Select Exam</label>
        <select className="input max-w-md" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
          <option value="">Choose an exam...</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      {analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-2xl font-bold">{analytics.overview.completed}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold">{Number(analytics.overview.avg_percentage).toFixed(1)}%</p>
              <p className="text-sm text-slate-500">Avg Score</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-green-600">{analytics.overview.passed_count}</p>
              <p className="text-sm text-slate-500">Passed</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-red-600">
                {Number(analytics.overview.completed) - Number(analytics.overview.passed_count)}
              </p>
              <p className="text-sm text-slate-500">Failed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold mb-4">Score Distribution</h3>
              {analytics.scoreDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#326455" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center py-8">No data yet</p>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">Proctoring Events</h3>
              {analytics.proctoringSummary.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.proctoringSummary}
                      dataKey="count"
                      nameKey="event_type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ event_type, count }) => `${event_type}: ${count}`}
                    >
                      {analytics.proctoringSummary.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-center py-8">No proctoring events</p>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Top Performers</h3>
            {analytics.topPerformers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="pb-2">Rank</th>
                      <th className="pb-2">Student</th>
                      <th className="pb-2">Score</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topPerformers.map((p, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">#{i + 1}</td>
                        <td className="py-2 font-medium">{p.full_name}</td>
                        <td className="py-2">{Number(p.percentage).toFixed(1)}%</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            p.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {p.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No results yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
