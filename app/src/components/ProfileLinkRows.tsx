import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { LoadingIndicator } from '@/components/LoadingIndicator';

import { ThemedSurface } from '@/components/ThemedSurface';
import { useAppColors } from '@/hooks/useAppColors';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ProfileLinkIcon =
  'friends' | 'history' | 'password' | 'autotracking' | 'sync' | 'export' | 'clear' | 'signout';

export interface ProfileLinkRow {
  id: string;
  label: string;
  onPress?: () => void;
  badge?: number;
  icon?: ProfileLinkIcon;
  subtitle?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  toggle?: {
    value: boolean;
    onValueChange: (value: boolean) => void;
  };
}

const ICONS: Record<ProfileLinkIcon, IoniconName> = {
  friends: 'people-outline',
  history: 'time-outline',
  password: 'lock-closed-outline',
  autotracking: 'navigate-outline',
  sync: 'cloud-upload-outline',
  export: 'download-outline',
  clear: 'trash-outline',
  signout: 'log-out-outline',
};

interface ProfileLinkRowsProps {
  rows: ProfileLinkRow[];
}

export function ProfileLinkRows({ rows }: ProfileLinkRowsProps) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="mb-4 overflow-hidden p-0">
      {rows.map((row, index) => {
        const isInactive = row.disabled || row.loading;
        const destructive = row.variant === 'destructive';
        const labelColor = destructive
          ? colors.destructive
          : isInactive
            ? colors.textDisabled
            : colors.text;
        const iconColor = destructive
          ? colors.destructive
          : isInactive
            ? colors.textDisabled
            : colors.textMuted;
        const showChevron = row.showChevron ?? !row.toggle;

        const handlePress = () => {
          if (row.disabled || row.loading) return;
          if (row.toggle) {
            row.toggle.onValueChange(!row.toggle.value);
            return;
          }
          row.onPress?.();
        };

        return (
          <Pressable
            key={row.id}
            onPress={handlePress}
            disabled={row.disabled || row.loading}
            className="flex-row items-center justify-between px-4 py-3.5"
            style={{
              borderBottomWidth: index < rows.length - 1 ? 1 : 0,
              borderBottomColor: colors.glassBorder,
            }}
          >
            <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-2">
              {row.icon ? <Ionicons name={ICONS[row.icon]} size={18} color={iconColor} /> : null}
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-medium" style={{ color: labelColor }}>
                  {row.label}
                </Text>
                {row.subtitle ? (
                  <Text className="mt-0.5 text-xs" style={{ color: colors.textMuted }}>
                    {row.subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              {row.badge && row.badge > 0 ? (
                <View
                  className="min-w-[1.25rem] rounded-full px-1.5 py-0.5"
                  style={{ backgroundColor: colors.primaryBright }}
                >
                  <Text className="text-center text-xs font-bold text-white">{row.badge}</Text>
                </View>
              ) : null}
              {row.loading ? (
                <LoadingIndicator size="small" />
              ) : row.toggle ? (
                <Pressable
                  onPress={() => row.toggle!.onValueChange(!row.toggle!.value)}
                  disabled={row.disabled || row.loading}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: row.toggle.value }}
                  accessibilityLabel={row.label}
                  hitSlop={8}
                  className="h-7 w-12 shrink-0 flex-row items-center overflow-hidden rounded-full border p-0.5"
                  style={{
                    backgroundColor: row.toggle.value ? colors.primary : colors.secondaryBg,
                    borderColor: row.toggle.value ? colors.primary : colors.surfaceBorder,
                    justifyContent: row.toggle.value ? 'flex-end' : 'flex-start',
                  }}
                >
                  <View className="h-5 w-5 rounded-full bg-white" />
                </Pressable>
              ) : showChevron ? (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </ThemedSurface>
  );
}
