import { useHeaderHeight } from '@react-navigation/elements';
import { View, type ViewProps } from 'react-native';

interface TabScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function TabScreenContainer({ children, className, style, ...props }: TabScreenContainerProps) {
  const headerHeight = useHeaderHeight();

  return (
    <View className={className} style={[{ flex: 1, paddingTop: headerHeight }, style]} {...props}>
      {children}
    </View>
  );
}
