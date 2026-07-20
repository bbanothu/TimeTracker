import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const ANIMATION = {
  duration: 300,
  easing: Easing.out(Easing.cubic),
};

interface ExpandableDetailsProps {
  expanded: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ExpandableDetails({ expanded, children, style }: ExpandableDetailsProps) {
  const open = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    open.value = withTiming(expanded ? 1 : 0, ANIMATION);
  }, [expanded, open]);

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: open.value * 800,
    opacity: open.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View style={style}>{children}</View>
    </Animated.View>
  );
}

export function ExpandChevron({ expanded, color }: { expanded: boolean; color: string }) {
  const rotation = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 1 : 0, ANIMATION);
  }, [expanded, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name="chevron-down" size={16} color={color} />
    </Animated.View>
  );
}
