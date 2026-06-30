import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, Keyboard, Platform, Text, type ScrollView } from 'react-native';

import { GoalsAccountedSummary } from '@/components/GoalsAccountedSummary';
import { GoalsList } from '@/components/GoalsList';
import { TabScrollView } from '@/components/TabScrollView';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useGoals } from '@/hooks/useGoals';
import { useTags } from '@/hooks/useTags';
import { computeCategoryDurationsToday } from '@/utils/goalProgress';
import { goalCategories } from '@/utils/tagAnalytics';
import { getPeriodBounds } from '@/utils/periodBounds';

const KEYBOARD_GAP = 12;

export default function GoalsScreen() {
  const colors = useAppColors();
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const keyboardHeightRef = useRef(Platform.OS === 'ios' ? 320 : 280);
  const { tags } = useTags();
  const { goals, saveGoal } = useGoals();
  const { todayEntries, sessions, tick } = useActiveSession();

  const categories = useMemo(() => goalCategories(tags), [tags]);

  const progressByTagId = useMemo(() => {
    const { start, end } = getPeriodBounds(new Date(), 'day');
    return computeCategoryDurationsToday(
      todayEntries,
      tags,
      start.getTime(),
      end.getTime(),
      sessions,
      Date.now(),
    );
  }, [todayEntries, tags, sessions, tick]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      keyboardHeightRef.current = event.endCoordinates.height;
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = Platform.OS === 'ios' ? 320 : 280;
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollInputIntoView = useCallback((layout: { y: number; height: number }) => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const windowHeight = Dimensions.get('window').height;
    const visibleBottom = windowHeight - keyboardHeightRef.current - KEYBOARD_GAP;
    const inputBottom = layout.y + layout.height;

    if (inputBottom > visibleBottom) {
      scroll.scrollTo({
        y: scrollYRef.current + (inputBottom - visibleBottom),
        animated: true,
      });
    }
  }, []);

  return (
    <TabScreenContainer>
      <TabScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="px-4 pb-8 pt-2"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollYRef.current = event.nativeEvent.contentOffset.y;
        }}
      >
        <Text className="mb-4 text-sm" style={{ color: colors.textMuted }}>
          Set daily targets for your top-level categories. Saved targets stay on your account and
          apply every day until you change them. Time tracked on sub-tags counts toward the parent.
        </Text>
        <GoalsAccountedSummary progressByTagId={progressByTagId} />
        <GoalsList
          categories={categories}
          goals={goals}
          progressByTagId={progressByTagId}
          onSaveGoal={saveGoal}
          onInputFocus={scrollInputIntoView}
        />
      </TabScrollView>
    </TabScreenContainer>
  );
}
