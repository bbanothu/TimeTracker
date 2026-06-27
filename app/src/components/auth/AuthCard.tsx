import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';

import { authScreenStyles as styles } from '@/components/auth/authScreenStyles';

interface AuthCardProps {
  children: React.ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  const inner = (
    <View style={Platform.OS === 'android' ? androidStyles.inner : styles.cardInner}>
      {children}
    </View>
  );

  if (Platform.OS === 'android') {
    return <View style={androidStyles.card}>{inner}</View>;
  }

  return (
    <BlurView intensity={40} tint="light" style={styles.card}>
      {inner}
    </BlurView>
  );
}

const androidStyles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#1C1917',
  },
  inner: {
    padding: 22,
  },
});
