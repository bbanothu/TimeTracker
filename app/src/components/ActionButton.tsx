import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { LoadingIndicator } from '@/components/LoadingIndicator';
import { useAppColors } from '@/hooks/useAppColors';

type ActionButtonVariant = 'primary' | 'destructive' | 'destructiveOutline' | 'secondary';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: ActionButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
  textClassName?: string;
}

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className,
  style,
  size = 'md',
  textClassName,
}: ActionButtonProps) {
  const colors = useAppColors();

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      textColor: colors.textOnPrimary,
      spinnerColor: colors.spinnerOnPrimary,
    },
    destructive: {
      backgroundColor: colors.stop,
      borderColor: colors.stop,
      textColor: '#FFFFFF',
      spinnerColor: '#FFFFFF',
    },
    destructiveOutline: {
      backgroundColor: colors.destructiveBg,
      borderColor: colors.destructiveBorder,
      textColor: colors.destructiveText,
      spinnerColor: colors.destructiveText,
    },
    secondary: {
      backgroundColor: colors.secondaryBgSolid,
      borderColor: colors.secondaryBgSolid,
      textColor: colors.secondaryText,
      spinnerColor: colors.secondaryText,
    },
  }[variant];

  const paddingY = size === 'lg' ? 'py-4' : 'py-3';
  const textSize = size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-full border ${paddingY} ${className ?? ''}`}
      style={[
        {
          backgroundColor: disabled ? colors.disabled : variantStyles.backgroundColor,
          borderColor: disabled ? colors.disabled : variantStyles.borderColor,
          opacity: disabled ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <LoadingIndicator size="small" />
      ) : (
        <Text
          className={`text-center font-semibold ${textSize} ${textClassName ?? ''}`}
          style={{ color: variantStyles.textColor }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
