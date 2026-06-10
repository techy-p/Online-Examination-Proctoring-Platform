import { useEffect, useState } from 'react';
import { Shield, Video, AlertTriangle, User } from 'lucide-react';
import api from '../api/client';
import { ExamSession } from '../types';
import { useWebRTC } from '../hooks/useWebRTC';

function ProctorFeed({ session }: { session: ExamSession }) {
  const { remoteVideoRef } = useWebRTC({
    sessionId: session.id,
    isInitiator: false,
    enabled: true,
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <div>
            <p className="font-medium text-sm">{session.student_name}</p>
            <p className="text-xs text-slate-500">{session.exam_title}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg bg-slate-900 aspect-video object-cover"
      />
    </div>
  );
}

export default function ProctorDashboard() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = () => {
      api.get('/sessions/active')
        .then((res) => setSessions(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold">Live Proctoring</h1>
            <p className="text-slate-500 mt-1">Monitor active exam sessions via WebRTC</p>
          </div>
        </div>
      </div>

      <div className="card mb-6 bg-red-50 border-red-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Proctoring Guidelines</p>
            <p className="mt-1">Monitor student webcam feeds in real-time. Suspicious activities like tab switches and fullscreen exits are automatically logged.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card text-center py-16">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-medium text-slate-600">No Active Sessions</h3>
          <p className="text-sm text-slate-400 mt-1">Students will appear here when they start a proctored exam</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <ProctorFeed key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
