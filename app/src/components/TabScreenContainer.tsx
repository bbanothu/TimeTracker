import { View, type ViewProps } from 'react-native';

interface TabScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

/** Simple full-bleed tab scene wrapper. Page title lives inside TabScrollView. */
export function TabScreenContainer({
  children,
  className,
  style,
  ...props
}: TabScreenContainerProps) {
  return (
    <View className={className} style={[{ flex: 1 }, style]} {...props}>
      {children}
    </View>
  );
}
