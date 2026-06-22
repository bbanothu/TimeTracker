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
        <div className="mb-8 text-white">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/75">Welcome back</p>
          <h1 className="text-4xl font-extrabold tracking-tight">TimeTracker</h1>
          <p className="mt-2 text-white/80">Sign in and pick up where you left off</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-white/25 bg-white/10 p-6 shadow-glass backdrop-blur-md"
        >
          <h2 className="text-xl font-bold text-white">Sign in</h2>
          <p className="mb-5 mt-1 text-sm text-white/65">Your stats, tags, and sessions are waiting.</p>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="mb-3 w-full rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder:text-white/55"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="mb-4 w-full rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder:text-white/55"
          />

          {error ? <p className="mb-3 text-sm text-rose-200">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl py-3.5 font-bold text-white"
            style={{
              backgroundImage: `linear-gradient(90deg, ${colors.authGradient.join(', ')})`,
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <Link to="/register" className="mt-4 block text-center text-sm font-semibold text-white/90">
            New here? Create an account
          </Link>
        </form>
      </div>
    </AuthBackground>
  );
}
