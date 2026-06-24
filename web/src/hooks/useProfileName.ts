import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchMyProfile, updateMyProfileNames } from '@/services/profileService';

const SAVE_DELAY_MS = 600;

export function useProfileName() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readyRef = useRef(false);
  const savedRef = useRef({ firstName: '', lastName: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await fetchMyProfile();
      readyRef.current = false;
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      savedRef.current = {
        firstName: profile.firstName,
        lastName: profile.lastName,
      };
      readyRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  useEffect(() => {
    if (!readyRef.current) return;

    const unchanged =
      firstName === savedRef.current.firstName && lastName === savedRef.current.lastName;
    if (unchanged) return;

    const timer = window.setTimeout(() => {
      setSaving(true);
      setError(null);
      updateMyProfileNames(firstName, lastName)
        .then(() => {
          savedRef.current = { firstName, lastName };
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to save name');
        })
        .finally(() => setSaving(false));
    }, SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [firstName, lastName]);

  return {
    firstName,
    lastName,
    setFirstName,
    setLastName,
    loading,
    saving,
    error,
    reload: load,
  };
}
