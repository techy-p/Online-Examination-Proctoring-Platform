import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Zap, BarChart3, Video, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/brand/Logo';
import { BRAND } from '../config/brand';
import FormField from '../components/ui/FormField';

const features = [
  { icon: Video, title: 'Live Proctoring', desc: 'WebRTC-powered webcam monitoring' },
  { icon: Zap, title: 'Instant Grading', desc: 'Automated evaluation on submit' },
  { icon: Shield, title: 'Integrity Guard', desc: 'Tab-switch & anomaly detection' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Performance & violation insights' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const error = err as Error & { fieldErrors?: Record<string, string> };
      if (error.fieldErrors) setErrors(error.fieldErrors);
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[52%] brand-panel text-white p-12 flex-col justify-between relative">
        <div className="absolute inset-0 brand-grid-pattern" />
        <div className="relative z-10"><Logo size="lg" theme="light" /></div>

        <div className="relative z-10 max-w-lg">
          <p className="text-indigo-200 text-sm font-medium tracking-widest uppercase mb-4">Examination Platform</p>
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight mb-5">
            Secure assessments.<br /><span className="text-cyan-300">Zero compromise.</span>
          </h2>
          <p className="text-indigo-100/90 text-lg leading-relaxed">{BRAND.description}</p>
          <div className="mt-10 grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-colors">
                <Icon className="w-5 h-5 text-cyan-300 mb-2" />
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-indigo-200/80 text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-sm text-indigo-200/70">
          <span>Built by {BRAND.author}</span>
          <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded">{BRAND.domain}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10"><Logo size="md" /></div>

          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1.5">Sign in to your {BRAND.name} workspace</p>
          </div>

          {formError && !Object.keys(errors).length && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">{formError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Email address" error={errors.email}>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`you@${BRAND.domain}`} />
            </FormField>
            <FormField label="Password" error={errors.password}>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="input pr-11" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
            <button type="submit" className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : `Sign in to ${BRAND.name}`}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700">Create one</Link>
          </p>

          <details className="mt-8 group">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 list-none text-center">
              Show demo credentials
            </summary>
            <div className="mt-3 p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-500">
              <p className="font-semibold text-slate-700 mb-2">Password: Password123!</p>
              <div className="space-y-1 font-mono text-[11px]">
                <p>admin@{BRAND.domain}</p>
                <p>student@{BRAND.domain}</p>
                <p>proctor@{BRAND.domain}</p>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
