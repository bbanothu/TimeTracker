import { useEffect, useMemo, useState } from 'react';

import { getAllEntries } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { subscribeDataRefresh } from '@/lib/dataRefresh';
import type { Tag, TimeEntry } from '@/types';
import { flattenTags, type FlatTagItem } from '@/utils/tagTree';
import { buildTagUsageCounts, sortFlatTagsByUsage } from '@/utils/tagUsage';

export function useFlatTagsByUsage(tags: Tag[]): FlatTagItem[] {
  const { ready, sessions } = useActiveSession();
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    if (!ready) {
      setEntries([]);
      return;
    }

    const refresh = () => setEntries(getAllEntries());
    refresh();
    return subscribeDataRefresh(refresh);
  }, [ready]);

  return useMemo(() => {
    const flatTags = flattenTags(tags);
    const usageCounts = buildTagUsageCounts(entries);

    for (const session of sessions) {
      for (const tag of session.tags) {
        usageCounts.set(tag.id, (usageCounts.get(tag.id) ?? 0) + 1);
      }
    }

    return sortFlatTagsByUsage(flatTags, usageCounts);
  }, [tags, entries, sessions]);
}
