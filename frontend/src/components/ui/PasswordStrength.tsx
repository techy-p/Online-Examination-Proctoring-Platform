interface PasswordStrengthProps {
  password: string;
}

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const levels = [
  { label: '', color: 'bg-slate-200', width: 'w-0' },
  { label: 'Weak', color: 'bg-red-500', width: 'w-1/5' },
  { label: 'Fair', color: 'bg-amber-500', width: 'w-2/5' },
  { label: 'Good', color: 'bg-yellow-500', width: 'w-3/5' },
  { label: 'Strong', color: 'bg-emerald-500', width: 'w-4/5' },
  { label: 'Excellent', color: 'bg-emerald-600', width: 'w-full' },
];

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const score = getStrength(password);
  const level = levels[Math.min(score, 5)];

  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${level.color} ${level.width}`} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {checks.map((c) => (
            <span key={c.label} className={`text-[11px] ${c.met ? 'text-emerald-600' : 'text-slate-400'}`}>
              {c.met ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {level.label && (
          <span className="text-[11px] font-medium text-slate-500">{level.label}</span>
        )}
      </div>
    </div>
  );
}
