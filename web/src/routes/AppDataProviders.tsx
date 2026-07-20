import type { ReactNode } from 'react';

import { PullToRefresh } from '@/components/layout/PullToRefresh';
import { GoalsProvider } from '@/contexts/GoalsContext';
import { ProfilePhotoProvider } from '@/contexts/ProfilePhotoContext';
import { RefreshProvider } from '@/contexts/RefreshContext';
import { TagsProvider } from '@/contexts/TagsContext';
import { TimerProvider } from '@/contexts/TimerContext';

export function AppDataProviders({ children }: { children: ReactNode }) {
  return (
    <TagsProvider>
      <GoalsProvider>
        <TimerProvider>
          <ProfilePhotoProvider>
            <RefreshProvider>
              <PullToRefresh>{children}</PullToRefresh>
            </RefreshProvider>
          </ProfilePhotoProvider>
        </TimerProvider>
      </GoalsProvider>
    </TagsProvider>
  );
}
