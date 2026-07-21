import { useEffect, useState } from 'react';

import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useAppColors } from '@/contexts/ThemeContext';
import { buildProfileDisplayName, fetchMyProfile } from '@/services/profileService';

function welcomeName(firstName: string, lastName: string, email: string): string | null {
  const first = firstName.trim();
  if (first) return first;

  const full = buildProfileDisplayName({ firstName, lastName });
  if (full) return full.split(/\s+/)[0] ?? null;

  const local = email.split('@')[0]?.trim();
  return local || null;
}

export function AppBootSplash() {
  const colors = useAppColors();
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setName(welcomeName(profile.firstName, profile.lastName, profile.email));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [ready]);

  return (
    <div className="flex min-h-[40vh] flex-col py-16">
      <div className="flex flex-1 items-end justify-center px-6 pb-3">
        {ready ? (
          <div
            className="text-center transition-opacity duration-[900ms] ease-out"
            style={{ opacity: visible ? 1 : 0 }}
          >
            <h1 className="text-3xl font-semibold tracking-wide" style={{ color: colors.text }}>
              Welcome back
            </h1>
            {name ? (
              <p
                className="mt-2 text-2xl font-medium tracking-wide"
                style={{ color: colors.textMuted }}
              >
                {name}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-center">
        <LoadingIndicator size="large" />
      </div>
      <div className="flex-1" />
    </div>
  );
}
