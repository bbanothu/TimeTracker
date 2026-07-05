import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import type { StatsVisualization } from '@/types';

const STORAGE_KEY = 'irlday-stats-viz';

const VALID: StatsVisualization[] = ['overview', 'bars', 'list', 'stacked', 'history', 'trend'];

export function useStatsVisualization() {
  const [visualization, setVisualizationState] = useState<StatsVisualization>('overview');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored && VALID.includes(stored as StatsVisualization)) {
          setVisualizationState(stored as StatsVisualization);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setVisualization = useCallback((value: StatsVisualization) => {
    setVisualizationState(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => undefined);
  }, []);

  return { visualization, setVisualization, ready };
}
