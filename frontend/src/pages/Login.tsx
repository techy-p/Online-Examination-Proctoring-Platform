import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/brand/Logo';
import { BRAND } from '../config/brand';
import FormField from '../components/ui/FormField';

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
    <div className="min-h-screen grid lg:grid-cols-[1.08fr_0.92fr] bg-[#f4f3ef]">
      <section className="hidden lg:flex brand-panel text-white p-12 xl:p-16 flex-col justify-between relative">
        <div className="absolute inset-0 brand-grid-pattern" />
        <Logo size="lg" theme="light" className="relative z-10" />

        <div className="relative z-10 max-w-2xl">
          <p className="text-[#e1c995] text-xs font-semibold tracking-[0.2em] uppercase mb-6">Examination operations</p>
          <h2 className="font-display text-5xl xl:text-6xl font-medium tracking-[-0.04em] leading-[1.05] text-[#f7f3e9]">
            Assessment integrity,<br />handled with care.
          </h2>
          <p className="text-white/65 text-base leading-relaxed mt-7 max-w-xl">
            One workspace for question banks, timed examinations, candidate monitoring, evaluation, and reporting.
          </p>
          <div className="grid grid-cols-3 mt-12 border-y border-white/15 py-6">
            {[['04', 'Defined roles'], ['03', 'Question formats'], ['Live', 'Integrity signals']].map(([value, label]) => (
              <div key={label} className="border-r border-white/15 last:border-0 px-5 first:pl-0">
                <p className="font-display text-2xl text-[#f7f3e9]">{value}</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/45 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/45">
          <span>Built for accountable assessment</span>
          <span>{BRAND.domain}</span>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full min-w-0 max-w-[calc(100vw-3rem)] sm:max-w-[420px]">
          <div className="lg:hidden mb-12"><Logo size="md" /></div>
          <p className="text-xs uppercase tracking-[0.16em] font-semibold text-brand-700 mb-4">Secure access</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.035em] text-brand-950">Sign in to your workspace</h1>
          <p className="text-slate-600 mt-3 mb-9">Use your assigned account to continue.</p>

          {formError && !Object.keys(errors).length && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-5 text-sm">{formError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label="Email address" error={errors.email}>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`you@${BRAND.domain}`} />
            </FormField>
            <FormField label="Password" error={errors.password}>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="input pr-11" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
                <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormField>
            <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Continue <ArrowUpRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-sm text-slate-600 mt-7">
            New student? <Link to="/register" className="text-brand-700 font-semibold hover:text-brand-950">Create an account</Link>
          </p>

          <details className="mt-10 border-t border-slate-300 pt-5 group">
            <summary className="text-xs uppercase tracking-[0.12em] font-semibold text-slate-500 cursor-pointer hover:text-slate-800 list-none">Demo access</summary>
            <div className="mt-4 text-xs text-slate-600 leading-6">
              <p>Password: <span className="font-mono text-slate-800">Password123!</span></p>
              <p className="font-mono">admin@{BRAND.domain} / student@{BRAND.domain}</p>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
