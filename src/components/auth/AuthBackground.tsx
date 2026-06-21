import { BlurView } from 'expo-blur';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const defaultBackground = require('../../../assets/login1.jpg');

interface AuthBackgroundProps {
  children: React.ReactNode;
  source?: ImageSource;
}

export function AuthBackground({ children, source = defaultBackground }: AuthBackgroundProps) {
  return (
    <View style={styles.root}>
      <Image source={source} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFillObject} />
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.15)', 'rgba(30, 41, 59, 0.55)', 'rgba(15, 23, 42, 0.88)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
});
