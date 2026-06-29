import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useTimer } from '@/contexts/TimerContext';
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import { fetchAllEntries } from '@/services/data';
import type { Tag, TimeEntry } from '@/types';
import { flattenTags, type FlatTagItem } from '@/utils/tagTree';
import { buildTagUsageCounts, sortFlatTagsByUsage } from '@/utils/tagUsage';

export function useFlatTagsByUsage(tags: Tag[]): FlatTagItem[] {
  const { user } = useAuth();
  const { sessions } = useTimer();
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const refresh = () => {
      fetchAllEntries(user.id).then(setEntries).catch(console.error);
    };

    refresh();
    return subscribeDataRefresh(refresh);
  }, [user]);

  return useMemo(() => {
    const flatTags = flattenTags(tags);
    const usageCounts = buildTagUsageCounts(entries);

    for (const session of sessions) {
      for (const tagId of session.tagIds) {
        usageCounts.set(tagId, (usageCounts.get(tagId) ?? 0) + 1);
      }
    }

    return sortFlatTagsByUsage(flatTags, usageCounts);
  }, [tags, entries, sessions]);
}
