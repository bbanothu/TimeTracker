import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StatsCharts } from '@/components/StatsCharts';
import { ChartTypeSelector } from '@/components/ChartTypeSelector';
import { PeriodSelector } from '@/components/PeriodSelector';
import { StatsPersonSelector } from '@/components/StatsPersonSelector';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { useAuth } from '@/hooks/useAuth';
import { useAppColors } from '@/hooks/useAppColors';
import { useStats } from '@/hooks/useStats';
import { useStatsVisualization } from '@/hooks/useStatsVisualization';
import { fetchAcceptedFriends } from '@/services/friendsService';
import type { FriendshipOtherUser } from '@/types';
import { Text } from 'react-native';

export default function StatsScreen() {
  const colors = useAppColors();
  const router = useRouter();
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendshipOtherUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    try {
      const accepted = await fetchAcceptedFriends();
      setFriends(accepted);
      setSelectedUserId((current) => {
        if (current && !accepted.some((f) => f.userId === current)) return null;
        return current;
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFriends().catch(console.error);
    }, [loadFriends]),
  );

  const { ready, period, setPeriod, anchorDate, summary, shift, isViewingFriend } = useStats(
    'day',
    selectedUserId,
  );
  const { visualization, setVisualization, ready: vizReady } = useStatsVisualization();

  if (!ready || !vizReady || !user) {
    return (
      <TabScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      </TabScreenContainer>
    );
  }

  return (
    <TabScreenContainer className="px-4 pt-2">
      <TabScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-8">
        <StatsPersonSelector
          friends={friends}
          selectedUserId={selectedUserId}
          selfUserId={user.id}
          onChange={setSelectedUserId}
        />
        <PeriodSelector
          period={period}
          anchorDate={anchorDate}
          onPeriodChange={setPeriod}
          onShift={shift}
          onProgressPress={
            isViewingFriend
              ? undefined
              : () =>
                  router.push({
                    pathname: '/progress',
                    params: {
                      anchorDate: anchorDate.toISOString(),
                      period,
                    },
                  })
          }
          progressDisabled={isViewingFriend}
        />
        <ChartTypeSelector
          period={period}
          visualization={visualization}
          onChange={setVisualization}
        />
        <StatsCharts
          summary={summary}
          visualization={visualization}
          period={period}
          scrollEnabled={false}
        />
      </TabScrollView>
    </TabScreenContainer>
  );
}
