import { View, type ViewProps } from 'react-native';

import { useScreenTopPadding } from '@/hooks/useScreenTopPadding';

interface TabScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function TabScreenContainer({
  children,
  className,
  style,
  ...props
}: TabScreenContainerProps) {
  const paddingTop = useScreenTopPadding();

  return (
    <View className={className} style={[{ flex: 1, paddingTop }, style]} {...props}>
      {children}
    </View>
  );
}
