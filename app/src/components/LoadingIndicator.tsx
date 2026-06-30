import LottieView from 'lottie-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

const loadingAnimation = require('../../assets/loading.json');

export type LoadingIndicatorSize = 'small' | 'medium' | 'large' | number;

const SIZE_MAP = {
  small: 28,
  medium: 64,
  large: 220,
} as const;

interface LoadingIndicatorProps {
  size?: LoadingIndicatorSize;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function LoadingIndicator({ size = 'medium', className, style }: LoadingIndicatorProps) {
  const dimension = typeof size === 'number' ? size : SIZE_MAP[size];

  return (
    <View
      className={className}
      style={[{ width: dimension, height: dimension }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <LottieView
        source={loadingAnimation}
        autoPlay
        loop
        style={{ width: dimension, height: dimension }}
      />
    </View>
  );
}
