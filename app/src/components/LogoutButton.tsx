import { Alert, Pressable, Text, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

export function LogoutButton() {
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign out', 'Your local cache will be cleared. Cloud data stays saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => signOut().catch(console.error),
      },
    ]);
  };

  return (
    <Pressable
      onPress={handleLogout}
      className="mr-2 rounded-full bg-slate-100 px-3 py-1.5 dark:bg-slate-800"
    >
      <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">Logout</Text>
    </Pressable>
  );
}
