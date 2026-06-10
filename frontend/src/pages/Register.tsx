import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/brand/Logo';
import { BRAND } from '../config/brand';
import FormField from '../components/ui/FormField';
import PasswordStrength from '../components/ui/PasswordStrength';

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setLoading(true);
    try {
      await register(form);
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
      <div className="hidden lg:flex lg:w-2/5 brand-panel items-center justify-center p-12 relative">
        <div className="absolute inset-0 brand-grid-pattern" />
        <div className="relative z-10 text-center">
          <div className="flex flex-col items-center gap-4">
            <Logo size="xl" variant="icon" />
            <Logo size="lg" variant="wordmark" theme="light" />
          </div>
          <p className="text-indigo-200 mt-8 max-w-xs mx-auto text-sm leading-relaxed">
            Create your student account and start taking secure, proctored examinations.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo size="md" /></div>

          <div className="card shadow-brand/10">
            <h1 className="font-display text-2xl font-bold mb-1">Create your account</h1>
            <p className="text-slate-500 text-sm mb-6">Student registration for {BRAND.name}</p>

            {formError && !Object.keys(errors).length && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Full Name" error={errors.fullName}>
                <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Priyanshu Gupta" />
              </FormField>
              <FormField label="Email" error={errors.email}>
                <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={`you@${BRAND.domain}`} />
              </FormField>
              <FormField label="Password" error={errors.password} hint="Min. 8 chars with uppercase, lowercase, and number">
                <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <PasswordStrength password={form.password} />
              </FormField>
              <button type="submit" className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
