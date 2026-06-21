import { useCallback, useEffect, useState } from 'react';

import type { StatsVisualization } from '@/types';

const STORAGE_KEY = 'timetracker-stats-viz';

const VALID: StatsVisualization[] = ['overview', 'bars', 'list', 'stacked', 'trend'];

export function useStatsVisualization() {
  const [visualization, setVisualizationState] = useState<StatsVisualization>('overview');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID.includes(stored as StatsVisualization)) {
        setVisualizationState(stored as StatsVisualization);
      }
    } finally {
      setReady(true);
    }
  }, []);

  const setVisualization = useCallback((value: StatsVisualization) => {
    setVisualizationState(value);
    localStorage.setItem(STORAGE_KEY, value);
  }, []);

  return { visualization, setVisualization, ready };
}
