import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AppBackground } from '@/components/AppBackground';
import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';
import { useScreenTopPadding } from '@/hooks/useScreenTopPadding';
import {
  fetchFriendships,
  friendLabel,
  removeFriend,
  respondToRequest,
  sendFriendRequest,
} from '@/services/friendsService';
import type { Friendship } from '@/types';

export default function FriendsScreen() {
  const topPadding = useScreenTopPadding(8);
  const colors = useAppColors();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFriendships(await fetchFriendships());
    } catch (error) {
      Alert.alert('Load failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(console.error);
    }, [load]),
  );

  const accepted = useMemo(() => friendships.filter((f) => f.status === 'accepted'), [friendships]);
  const incomingRequests = friendships.filter(
    (f) => f.status === 'pending' && f.requesterId === f.otherUser.userId,
  );
  const outgoingRequests = friendships.filter(
    (f) => f.status === 'pending' && f.requesterId !== f.otherUser.userId,
  );

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    color: colors.text,
  };

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      await sendFriendRequest(trimmed);
      setEmail('');
      Alert.alert('Request sent', 'Your friend request was sent.');
      await load();
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async (id: string, accept: boolean) => {
    try {
      setActingId(id);
      await respondToRequest(id, accept);
      await load();
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setActingId(null);
    }
  };

  const confirmRemove = (id: string) => {
    Alert.alert('Remove friend', 'They will no longer see your stats.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setActingId(id);
          removeFriend(id)
            .then(() => load())
            .catch((error) => {
              Alert.alert(
                'Remove failed',
                error instanceof Error ? error.message : 'Unknown error',
              );
            })
            .finally(() => setActingId(null));
        },
      },
    ]);
  };

  const handleCancel = async (id: string) => {
    try {
      setActingId(id);
      await removeFriend(id);
      await load();
    } catch (error) {
      Alert.alert('Cancel failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setActingId(null);
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pb-8"
          style={{ paddingTop: topPadding }}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedSurface className="mb-4 p-4">
            <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
              Add friend
            </Text>
            <Text className="mb-4 text-sm" style={{ color: colors.textMuted }}>
              Enter the email address of someone who already has an account.
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="friend@example.com"
              placeholderTextColor={colors.inputPlaceholder}
              autoCapitalize="none"
              keyboardType="email-address"
              className="mb-3 rounded-xl border px-4 py-3 text-base"
              style={inputStyle}
            />
            <ActionButton
              label="Send request"
              onPress={handleSend}
              loading={sending}
              disabled={sending || !email.trim()}
            />
          </ThemedSurface>

          {loading ? (
            <ActivityIndicator color={colors.textMuted} />
          ) : (
            <>
              {incomingRequests.length > 0 ? (
                <ThemedSurface className="mb-4 p-4">
                  <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
                    Requests
                  </Text>
                  {incomingRequests.map((friendship) => (
                    <View
                      key={friendship.id}
                      className="mb-3 flex-row items-center gap-3 rounded-xl border px-3 py-3"
                      style={{ borderColor: colors.glassBorder }}
                    >
                      <Text
                        className="min-w-0 flex-1 text-sm"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {friendLabel(friendship.otherUser)}
                      </Text>
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => handleRespond(friendship.id, true)}
                          disabled={actingId !== null}
                          accessibilityLabel="Accept friend request"
                          className="rounded-full p-2"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            opacity: actingId !== null ? 0.5 : 1,
                          }}
                        >
                          <Ionicons name="checkmark" size={20} color={colors.primaryBright} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleRespond(friendship.id, false)}
                          disabled={actingId !== null}
                          accessibilityLabel="Decline friend request"
                          className="rounded-full p-2"
                          style={{
                            backgroundColor: colors.destructiveBg,
                            opacity: actingId !== null ? 0.5 : 1,
                          }}
                        >
                          <Ionicons name="close" size={20} color={colors.destructive} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ThemedSurface>
              ) : null}

              {outgoingRequests.length > 0 ? (
                <ThemedSurface className="mb-4 p-4">
                  <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
                    Sent requests
                  </Text>
                  {outgoingRequests.map((friendship) => (
                    <View
                      key={friendship.id}
                      className="mb-3 flex-row items-center gap-3 rounded-xl border px-3 py-3"
                      style={{ borderColor: colors.glassBorder }}
                    >
                      <Text
                        className="min-w-0 flex-1 text-sm"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {friendLabel(friendship.otherUser)}
                      </Text>
                      <Pressable
                        onPress={() => handleCancel(friendship.id)}
                        disabled={actingId !== null}
                        accessibilityLabel="Cancel friend request"
                        className="rounded-full p-2"
                        style={{
                          backgroundColor: colors.destructiveBg,
                          opacity: actingId !== null ? 0.5 : 1,
                        }}
                      >
                        <Ionicons name="close" size={20} color={colors.destructive} />
                      </Pressable>
                    </View>
                  ))}
                </ThemedSurface>
              ) : null}

              <ThemedSurface className="mb-4 p-4">
                <Text className="mb-3 text-base font-semibold" style={{ color: colors.text }}>
                  Friends
                </Text>
                {accepted.length === 0 ? (
                  <Text className="text-sm" style={{ color: colors.textMuted }}>
                    No friends yet. Send a request by email to get started.
                  </Text>
                ) : (
                  accepted.map((friendship) => (
                    <View
                      key={friendship.id}
                      className="mb-3 flex-row items-center gap-3 rounded-xl border px-3 py-3"
                      style={{ borderColor: colors.glassBorder }}
                    >
                      <Text
                        className="min-w-0 flex-1 text-sm"
                        style={{ color: colors.text }}
                        numberOfLines={1}
                      >
                        {friendLabel(friendship.otherUser)}
                      </Text>
                      <Pressable
                        onPress={() => confirmRemove(friendship.id)}
                        disabled={actingId !== null}
                        accessibilityLabel="Remove friend"
                        className="rounded-full p-2"
                        style={{
                          backgroundColor: colors.destructiveBg,
                          opacity: actingId !== null ? 0.5 : 1,
                        }}
                      >
                        <Ionicons name="close" size={20} color={colors.destructive} />
                      </Pressable>
                    </View>
                  ))
                )}
              </ThemedSurface>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}
