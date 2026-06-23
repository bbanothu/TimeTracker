import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';
import { friendLabel } from '@/services/friendsService';
import type { FriendshipOtherUser } from '@/types';

interface StatsPersonSelectorProps {
  friends: FriendshipOtherUser[];
  selectedUserId: string | null;
  selfUserId: string;
  onChange: (userId: string | null) => void;
}

export function StatsPersonSelector({
  friends,
  selectedUserId,
  selfUserId,
  onChange,
}: StatsPersonSelectorProps) {
  const colors = useAppColors();
  const [open, setOpen] = useState(false);

  if (friends.length === 0) return null;

  const activeId = selectedUserId && selectedUserId !== selfUserId ? selectedUserId : selfUserId;
  const viewingFriend =
    selectedUserId !== null && selectedUserId !== selfUserId
      ? friends.find((f) => f.userId === selectedUserId)
      : null;

  const options: Array<{ id: string; label: string }> = [
    { id: selfUserId, label: 'Me' },
    ...friends.map((friend) => ({ id: friend.userId, label: friendLabel(friend) })),
  ];
  const activeLabel = options.find((o) => o.id === activeId)?.label ?? 'Me';

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
        Viewing stats for
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="rounded-xl border px-4 py-3"
        style={{ backgroundColor: colors.inputBg, borderColor: colors.inputBorder }}
      >
        <Text className="text-sm font-medium" style={{ color: colors.text }}>
          {activeLabel}
        </Text>
      </Pressable>
      {viewingFriend ? (
        <Text className="mt-2 text-sm" style={{ color: colors.textMuted }}>
          Viewing {friendLabel(viewingFriend)}&apos;s stats (read-only)
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable
            className="rounded-t-2xl p-4"
            style={{ backgroundColor: colors.surfaceSolid }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              View stats for
            </Text>
            {options.map((option) => {
              const selected = option.id === activeId;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    onChange(option.id === selfUserId ? null : option.id);
                    setOpen(false);
                  }}
                  className="mb-2 rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: selected ? colors.selectedBg : colors.secondaryBg,
                  }}
                >
                  <Text
                    className="font-medium"
                    style={{ color: selected ? colors.selectedText : colors.text }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
