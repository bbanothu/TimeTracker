import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { LoadingIndicator } from '@/components/LoadingIndicator';
import { useAppColors } from '@/hooks/useAppColors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface SettingsRowProps {
  label: string;
  onPress?: () => void;
  badge?: number;
  icon?: IoniconName;
  iconColor?: string;
  subtitle?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  showSeparator?: boolean;
  toggle?: {
    value: boolean;
    onValueChange: (value: boolean) => void;
  };
}

export function SettingsRow({
  label,
  onPress,
  badge,
  icon,
  iconColor = '#8E8E93',
  subtitle,
  variant = 'default',
  loading = false,
  disabled = false,
  showChevron,
  showSeparator = false,
  toggle,
}: SettingsRowProps) {
  const colors = useAppColors();
  const isInactive = disabled || loading;
  const destructive = variant === 'destructive';
  const labelColor = destructive
    ? colors.destructive
    : isInactive
      ? colors.textDisabled
      : colors.text;
  const chevron = showChevron ?? !toggle;

  const handlePress = () => {
    if (disabled || loading) return;
    if (toggle) {
      toggle.onValueChange(!toggle.value);
      return;
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className="flex-row items-center justify-between px-4 py-3"
      style={{
        borderBottomWidth: showSeparator ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: colors.separator,
      }}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-2">
        {icon ? (
          <View
            className="h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: destructive ? colors.destructive : iconColor }}
          >
            <Ionicons name={icon} size={15} color="#FFFFFF" />
          </View>
        ) : null}
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-normal" style={{ color: labelColor }}>
            {label}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-xs" style={{ color: colors.textMuted }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="flex-row items-center gap-2">
        {badge && badge > 0 ? (
          <View
            className="min-w-[1.25rem] rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-center text-xs font-bold" style={{ color: colors.textOnPrimary }}>
              {badge}
            </Text>
          </View>
        ) : null}
        {loading ? (
          <LoadingIndicator size="small" />
        ) : toggle ? (
          <Switch
            value={toggle.value}
            onValueChange={toggle.onValueChange}
            disabled={disabled || loading}
            trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.switchTrackOff}
          />
        ) : chevron ? (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        ) : null}
      </View>
    </Pressable>
  );
}
