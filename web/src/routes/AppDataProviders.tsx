import type { ReactNode } from 'react';

import { PullToRefresh } from '@/components/layout/PullToRefresh';
import { GoalsProvider } from '@/contexts/GoalsContext';
import { ProfilePhotoProvider } from '@/contexts/ProfilePhotoContext';
import { RefreshProvider } from '@/contexts/RefreshContext';
import { TagsProvider } from '@/contexts/TagsContext';
import { TimerProvider } from '@/contexts/TimerContext';
import { TrackingDataProvider } from '@/contexts/TrackingDataContext';

export function AppDataProviders({ children }: { children: ReactNode }) {
  return (
    <TagsProvider>
      <GoalsProvider>
        <TimerProvider>
          <TrackingDataProvider>
            <ProfilePhotoProvider>
              <RefreshProvider>
                <PullToRefresh>{children}</PullToRefresh>
              </RefreshProvider>
            </ProfilePhotoProvider>
          </TrackingDataProvider>
        </TimerProvider>
      </GoalsProvider>
    </TagsProvider>
  );
}
