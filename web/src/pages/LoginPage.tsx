import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';

import { AuthBackground } from '@/components/layout/AuthBackground';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
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
    color: colors.text,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
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
    <AuthBackground>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight" style={{ color: colors.text }}>
            TimeTracker
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Sign in and pick up where you left off
          </p>
        </div>

        <ThemedSurface className="p-6">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
              Sign in
            </h2>
            <p className="mb-5 mt-1 text-sm" style={{ color: colors.textMuted }}>
              Your stats, tags, and sessions are waiting.
            </p>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="mb-3 w-full rounded-full border px-4 py-3 outline-none"
              style={{ ...inputStyle, ['--tw-placeholder-opacity' as string]: 1 }}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="mb-4 w-full rounded-full border px-4 py-3 outline-none"
              style={inputStyle}
            />

            {error ? (
              <p className="mb-3 text-sm" style={{ color: colors.destructiveText }}>
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-full py-3.5 font-semibold"
              style={{
                color: colors.textOnPrimary,
                backgroundColor: colors.primary,
              }}
            >
              {submitting ? <LoadingIndicator size="small" /> : 'Sign in'}
            </button>

            <Link
              to="/register"
              className="mt-4 block text-center text-sm font-semibold"
              style={{ color: colors.primary }}
            >
              New here? Create an account
            </Link>
          </form>
        </ThemedSurface>
      </div>
    </AuthBackground>
  );
}
