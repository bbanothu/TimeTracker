import { Link, Navigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';

import { AuthBackground } from '@/components/layout/AuthBackground';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
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
        <div className="mb-8">
          <p
            className="mb-2 text-sm font-semibold uppercase tracking-wide"
            style={{ color: colors.authTextSecondary }}
          >
            Get started
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: colors.authText }}>
            TimeTracker
          </h1>
          <p className="mt-2" style={{ color: colors.authTextSecondary }}>
            Create an account and sync your time everywhere
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-white/25 bg-white/10 p-6 shadow-glass backdrop-blur-md"
        >
          <h2 className="text-xl font-bold" style={{ color: colors.authText }}>
            Create account
          </h2>
          <p className="mb-5 mt-1 text-sm" style={{ color: colors.authTextMuted }}>
            Track tags, stats, and places across devices.
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
            className="mb-3 w-full rounded-2xl border px-4 py-3 placeholder:text-[#A8A29E]"
            style={inputStyle}
          />
          <input
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            type="password"
            className="mb-4 w-full rounded-2xl border px-4 py-3 placeholder:text-[#A8A29E]"
            style={inputStyle}
          />

          {error ? <p className="mb-3 text-sm text-rose-200">{error}</p> : null}
          {message ? <p className="mb-3 text-sm text-emerald-100">{message}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-2xl py-3.5 font-bold"
            style={{
              color: colors.authText,
              backgroundImage: `linear-gradient(90deg, ${colors.authGradient.join(', ')})`,
            }}
          >
            {submitting ? <LoadingIndicator size="small" /> : 'Create account'}
          </button>

          <Link
            to="/login"
            className="mt-4 block text-center text-sm font-semibold"
            style={{ color: colors.authText }}
          >
            Already have an account? Sign in
          </Link>
        </form>
      </div>
    </AuthBackground>
  );
}
