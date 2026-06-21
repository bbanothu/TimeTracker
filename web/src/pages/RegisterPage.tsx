import { Link, Navigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';

import { AuthBackground } from '@/components/layout/AuthBackground';
import { useAuth } from '@/contexts/AuthContext';
import { useAppColors } from '@/contexts/ThemeContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export function RegisterPage() {
  const colors = useAppColors();
  const { signUp, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setError('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to web/.env');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Use at least 6 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await signUp(email.trim(), password);
      setMessage('Account created. You can now sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthBackground image="/assets/login2.jpg">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 text-white">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/75">Get started</p>
          <h1 className="text-4xl font-extrabold tracking-tight">TimeTracker</h1>
          <p className="mt-2 text-white/80">Create an account and sync your time everywhere</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-white/25 bg-white/10 p-6 shadow-glass backdrop-blur-md"
        >
          <h2 className="text-xl font-bold text-white">Create account</h2>
          <p className="mb-5 mt-1 text-sm text-white/65">Track tags, stats, and places across devices.</p>

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
            className="mb-3 w-full rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder:text-white/55"
          />
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            type="password"
            className="mb-4 w-full rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder:text-white/55"
          />

          {error ? <p className="mb-3 text-sm text-rose-200">{error}</p> : null}
          {message ? <p className="mb-3 text-sm text-emerald-100">{message}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl py-3.5 font-bold text-white"
            style={{
              backgroundImage: `linear-gradient(90deg, ${colors.authGradient.join(', ')})`,
            }}
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>

          <Link to="/login" className="mt-4 block text-center text-sm font-semibold text-white/90">
            Already have an account? Sign in
          </Link>
        </form>
      </div>
    </AuthBackground>
  );
}
