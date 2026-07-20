import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';

export function useAuthScreenEnter() {
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setReady(false);
      const task = InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => setReady(true));
      });

      return () => {
        task.cancel();
        setReady(false);
      };
    }, []),
  );

  return ready;
}
