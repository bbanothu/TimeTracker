import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';

import { AuthBackground } from '@/components/layout/AuthBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export function LoginPage() {
  const colors = useAppColors();
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = {
    color: colors.authText,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  };

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to web/.env');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthBackground image="/assets/login1.jpg">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8">
          <p
            className="mb-2 text-sm font-semibold uppercase tracking-wide"
            style={{ color: colors.authTextSecondary }}
          >
            Welcome back
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: colors.authText }}>
            TimeTracker
          </h1>
          <p className="mt-2" style={{ color: colors.authTextSecondary }}>
            Sign in and pick up where you left off
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-white/25 bg-white/10 p-6 shadow-glass backdrop-blur-md"
        >
          <h2 className="text-xl font-bold" style={{ color: colors.authText }}>
            Sign in
          </h2>
          <p className="mb-5 mt-1 text-sm" style={{ color: colors.authTextMuted }}>
            Your stats, tags, and sessions are waiting.
          </p>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="mb-3 w-full rounded-2xl border px-4 py-3 placeholder:text-[#A8A29E]"
            style={inputStyle}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="mb-4 w-full rounded-2xl border px-4 py-3 placeholder:text-[#A8A29E]"
            style={inputStyle}
          />

          {error ? <p className="mb-3 text-sm text-rose-200">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl py-3.5 font-bold"
            style={{
              color: colors.authText,
              backgroundImage: `linear-gradient(90deg, ${colors.authGradient.join(', ')})`,
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <Link
            to="/register"
            className="mt-4 block text-center text-sm font-semibold"
            style={{ color: colors.authText }}
          >
            New here? Create an account
          </Link>
        </form>
      </div>
    </AuthBackground>
  );
}
