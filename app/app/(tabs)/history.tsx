import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';

import { EntryList } from '@/components/EntryList';
import { TabScreenContainer } from '@/components/TabScreenContainer';
import { deleteEntry, getAllEntries, getGeofenceById } from '@/db/client';
import { useActiveSession } from '@/hooks/useActiveSession';
import { useAppColors } from '@/hooks/useAppColors';
import { useAuth } from '@/hooks/useAuth';
import { notifyDataRefresh } from '@/lib/dataRefresh';
import { syncService } from '@/services/syncService';
import type { TimeEntry } from '@/types';

export default function HistoryScreen() {
  const colors = useAppColors();
  const { user } = useAuth();
  const { ready, entriesRevision } = useActiveSession();
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    if (!ready) return;
    setEntries([...getAllEntries()].reverse());
  }, [ready, entriesRevision]);

  const geofenceNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of entries) {
      if (!entry.geofenceId || map.has(entry.geofenceId)) continue;
      const geofence = getGeofenceById(entry.geofenceId);
      if (geofence) map.set(entry.geofenceId, geofence.name);
    }
    return map;
  }, [entries]);

  const handleDelete = (entryId: string) => {
    Alert.alert('Delete entry', 'Remove this tracked session permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            deleteEntry(entryId);
            notifyDataRefresh();
            if (user) {
              syncService.push(user.id).catch(console.warn);
            }
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unknown error');
          }
        },
      },
    ]);
  };

  if (!ready) {
    return (
      <TabScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.textMuted }}>Loading...</Text>
      </TabScreenContainer>
    );
  }

  return (
    <TabScreenContainer>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-2">
        <Text className="mb-2 text-sm font-medium" style={{ color: colors.textMuted }}>
          All records ({entries.length})
        </Text>
        <EntryList
          entries={entries}
          emptyMessage="Nothing recorded yet."
          geofenceNames={geofenceNames}
          showDate
          onDelete={handleDelete}
        />
      </ScrollView>
    </TabScreenContainer>
  );
}
