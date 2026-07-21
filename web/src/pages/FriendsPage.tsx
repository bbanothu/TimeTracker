import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { checkmark, close } from 'ionicons/icons';

import { PageHeader } from '@/components/layout/PageHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { AppIcon } from '@/components/ui/AppIcon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';
import {
  fetchFriendships,
  friendLabel,
  removeFriend,
  respondToRequest,
  sendFriendRequest,
} from '@/services/friendsService';
import type { Friendship } from '@/types';

export function FriendsPage() {
  const colors = useAppColors();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFriendships(await fetchFriendships());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const accepted = useMemo(() => friendships.filter((f) => f.status === 'accepted'), [friendships]);

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      setError(null);
      setMessage(null);
      await sendFriendRequest(trimmed);
      setEmail('');
      setMessage('Friend request sent.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async (id: string, accept: boolean) => {
    try {
      setActingId(id);
      setError(null);
      setMessage(null);
      await respondToRequest(id, accept);
      setMessage(accept ? 'Friend request accepted.' : 'Friend request declined.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActingId(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Remove this friend? They will no longer see your stats.')) return;

    try {
      setActingId(id);
      setError(null);
      setMessage(null);
      await removeFriend(id);
      setMessage('Friend removed.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed');
    } finally {
      setActingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setActingId(id);
      setError(null);
      setMessage(null);
      await removeFriend(id);
      setMessage('Request cancelled.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setActingId(null);
    }
  };

  const incomingRequests = friendships.filter(
    (f) => f.status === 'pending' && f.requesterId === f.otherUser.userId,
  );
  const outgoingRequests = friendships.filter(
    (f) => f.status === 'pending' && f.requesterId !== f.otherUser.userId,
  );

  return (
    <div>
      <PageHeader title="Friends" backLink={{ to: '/profile', label: '← Account' }} />

      {message ? <p className="mb-3 text-sm text-emerald-600">{message}</p> : null}
      {error ? <p className="mb-3 text-sm text-rose-500">{error}</p> : null}

      <ThemedSurface className="mb-4 p-4">
        <h2 className="mb-3 font-semibold" style={{ color: colors.text }}>
          Add friend
        </h2>
        <p className="mb-4 text-sm" style={{ color: colors.textMuted }}>
          Enter the email address of someone who already has an account.
        </p>
        <form onSubmit={handleSend}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            type="email"
            autoCapitalize="none"
            className="mb-3 w-full rounded-xl border px-4 py-3"
            style={inputStyle}
          />
          <ActionButton
            label="Send request"
            type="submit"
            loading={sending}
            disabled={sending || !email.trim()}
            className="w-full"
          />
        </form>
      </ThemedSurface>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingIndicator size="medium" />
        </div>
      ) : (
        <>
          {incomingRequests.length > 0 ? (
            <ThemedSurface className="mb-4 overflow-hidden">
              <h2 className="mb-3 px-3 pt-4 text-base font-semibold" style={{ color: colors.text }}>
                Requests
              </h2>
              <ul>
                {incomingRequests.map((friendship, index) => (
                  <li
                    key={friendship.id}
                    className={`flex items-center gap-3 border-t px-3 py-3${
                      index === incomingRequests.length - 1 ? ' rounded-b-xl' : ''
                    }`}
                    style={{ borderColor: colors.glassBorder }}
                  >
                    <p className="min-w-0 flex-1 truncate text-sm" style={{ color: colors.text }}>
                      {friendLabel(friendship.otherUser)}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        aria-label="Accept friend request"
                        onClick={() => handleRespond(friendship.id, true)}
                        disabled={actingId !== null}
                        className="rounded-full p-2 disabled:opacity-50"
                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
                      >
                        <AppIcon icon={checkmark} size={20} color={colors.primaryBright} />
                      </button>
                      <button
                        type="button"
                        aria-label="Decline friend request"
                        onClick={() => handleRespond(friendship.id, false)}
                        disabled={actingId !== null}
                        className="rounded-full p-2 disabled:opacity-50"
                        style={{ backgroundColor: colors.destructiveBg }}
                      >
                        <AppIcon icon={close} size={20} color={colors.destructive} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </ThemedSurface>
          ) : null}

          {outgoingRequests.length > 0 ? (
            <ThemedSurface className="mb-4 overflow-hidden">
              <h2 className="mb-3 px-3 pt-4 text-base font-semibold" style={{ color: colors.text }}>
                Sent requests
              </h2>
              <ul>
                {outgoingRequests.map((friendship, index) => (
                  <li
                    key={friendship.id}
                    className={`flex items-center gap-3 border-t px-3 py-3${
                      index === outgoingRequests.length - 1 ? ' rounded-b-xl' : ''
                    }`}
                    style={{ borderColor: colors.glassBorder }}
                  >
                    <p className="min-w-0 flex-1 truncate text-sm" style={{ color: colors.text }}>
                      {friendLabel(friendship.otherUser)}
                    </p>
                    <button
                      type="button"
                      aria-label="Cancel friend request"
                      onClick={() => handleCancel(friendship.id)}
                      disabled={actingId !== null}
                      className="shrink-0 rounded-full p-2 disabled:opacity-50"
                      style={{ backgroundColor: colors.destructiveBg }}
                    >
                      <AppIcon icon={close} size={20} color={colors.destructive} />
                    </button>
                  </li>
                ))}
              </ul>
            </ThemedSurface>
          ) : null}

          <ThemedSurface className="mb-4 overflow-hidden">
            <h2 className="mb-3 px-3 pt-4 text-base font-semibold" style={{ color: colors.text }}>
              Friends
            </h2>
            {accepted.length === 0 ? (
              <p className="px-3 pb-4 text-sm" style={{ color: colors.textMuted }}>
                No friends yet. Send a request by email to get started.
              </p>
            ) : (
              <ul>
                {accepted.map((friendship, index) => (
                  <li
                    key={friendship.id}
                    className={`flex items-center gap-3 border-t px-3 py-3${
                      index === accepted.length - 1 ? ' rounded-b-xl' : ''
                    }`}
                    style={{ borderColor: colors.glassBorder }}
                  >
                    <p className="min-w-0 flex-1 truncate text-sm" style={{ color: colors.text }}>
                      {friendLabel(friendship.otherUser)}
                    </p>
                    <button
                      type="button"
                      aria-label="Remove friend"
                      onClick={() => handleRemove(friendship.id)}
                      disabled={actingId !== null}
                      className="shrink-0 rounded-full p-2 disabled:opacity-50"
                      style={{ backgroundColor: colors.destructiveBg }}
                    >
                      <AppIcon icon={close} size={20} color={colors.destructive} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ThemedSurface>
        </>
      )}
    </div>
  );
}
