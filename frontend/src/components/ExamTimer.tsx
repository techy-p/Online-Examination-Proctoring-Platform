import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ExamTimerProps {
  initialSeconds: number;
  onExpire: () => void;
}

export default function ExamTimer({ initialSeconds, onExpire }: ExamTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onExpire]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLow = seconds < 300;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold ${
        isLow ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
      }`}
    >
      {isLow ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}
