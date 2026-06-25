import { useAppColors } from '@/contexts/ThemeContext';
import { friendLabel } from '@/services/friendsService';
import type { FriendshipOtherUser } from '@/types';

interface StatsPersonSelectorProps {
  friends: FriendshipOtherUser[];
  selectedUserId: string | null;
  selfUserId: string;
  onChange: (userId: string | null) => void;
  className?: string;
}

export function StatsPersonSelector({
  friends,
  selectedUserId,
  selfUserId,
  onChange,
  className = '',
}: StatsPersonSelectorProps) {
  const colors = useAppColors();

  if (friends.length === 0) return null;

  const value = selectedUserId && selectedUserId !== selfUserId ? selectedUserId : selfUserId;
  const viewingFriend =
    selectedUserId !== null && selectedUserId !== selfUserId
      ? friends.find((f) => f.userId === selectedUserId)
      : null;

  return (
    <div className={`mb-4 lg:mb-0 lg:min-w-[200px] ${className}`}>
      <label className="mb-2 block text-sm font-medium" style={{ color: colors.textMuted }}>
        Viewing stats for
      </label>
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next === selfUserId ? null : next);
        }}
        className="w-full rounded-xl border px-4 py-3 text-sm font-medium"
        style={{
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          color: colors.text,
        }}
      >
        <option value={selfUserId}>Me</option>
        {friends.map((friend) => (
          <option key={friend.userId} value={friend.userId}>
            {friendLabel(friend)}
          </option>
        ))}
      </select>
      {viewingFriend ? (
        <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
          Viewing {friendLabel(viewingFriend)}&apos;s stats (read-only)
        </p>
      ) : null}
    </div>
  );
}
