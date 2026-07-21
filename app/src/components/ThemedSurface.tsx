import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppColors } from '@/hooks/useAppColors';

interface ThemedSurfaceProps {
  children: React.ReactNode;
  variant?: 'surface' | 'glass';
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const RADIUS = 16;

/** Margins sit outside the glass; padding/content classes sit inside so blur fills the rounded rect. */
function splitSurfaceClassName(className?: string): {
  outer: string;
  inner: string;
} {
  const outer: string[] = [];
  const inner: string[] = [];

  for (const token of (className ?? '').split(/\s+/).filter(Boolean)) {
    if (token === 'overflow-hidden') continue;
    if (/^(m[trblxyse]?-)/.test(token)) {
      outer.push(token);
    } else {
      inner.push(token);
    }
  }

  return { outer: outer.join(' '), inner: inner.join(' ') };
}

/**
 * Frosted glass clipped to the full rounded rect.
 * Padding must live inside the clip — if it sits on the shell, RN leaves a matte frame.
 */
export function ThemedSurface({
  children,
  variant = 'glass',
  className,
  style,
}: ThemedSurfaceProps) {
  const colors = useAppColors();
  const wash = variant === 'glass' ? colors.glass : colors.surface;
  const { outer, inner } = splitSurfaceClassName(className);

  const shell = (
    <View
      style={{
        borderRadius: RADIUS,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.glassBorder,
      }}
    >
      {Platform.OS === 'ios' ? (
        <>
          <BlurView
            intensity={Math.max(colors.blurIntensity, 48)}
            tint={colors.blurTint}
            style={StyleSheet.absoluteFillObject}
          />
          <View className={inner || undefined} style={{ backgroundColor: wash }}>
            {children}
          </View>
        </>
      ) : (
        <View className={inner || undefined} style={{ backgroundColor: colors.surfaceSolid }}>
          {children}
        </View>
      )}
    </View>
  );

  if (!outer && !style) return shell;

  return (
    <View className={outer || undefined} style={style}>
      {shell}
    </View>
  );
}
