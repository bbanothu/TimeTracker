import {
  calendar,
  chevronForward,
  cloudUpload,
  download,
  lockClosed,
  logOut,
  people,
  time,
  trash,
} from 'ionicons/icons';

import { AppIcon } from '@/components/ui/AppIcon';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ThemedSurface } from '@/components/ui/ThemedSurface';
import { useAppColors } from '@/contexts/ThemeContext';

export type ProfileLinkIcon =
  'friends' | 'history' | 'password' | 'calendar' | 'sync' | 'export' | 'clear' | 'signout';

export interface ProfileLinkRow {
  id: string;
  label: string;
  onClick: () => void;
  badge?: number;
  icon?: ProfileLinkIcon;
  subtitle?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
}

const ICONS: Record<ProfileLinkIcon, string> = {
  friends: people,
  history: time,
  password: lockClosed,
  calendar: calendar,
  sync: cloudUpload,
  export: download,
  clear: trash,
  signout: logOut,
};

const ICON_COLORS: Record<ProfileLinkIcon, string> = {
  friends: '#007AFF',
  history: '#5856D6',
  password: '#8E8E93',
  calendar: '#FF9500',
  sync: '#32ADE6',
  export: '#AF52DE',
  clear: '#FF3B30',
  signout: '#FF3B30',
};

interface ProfileLinkRowsProps {
  rows: ProfileLinkRow[];
}

export function ProfileLinkRows({ rows }: ProfileLinkRowsProps) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="mb-4 overflow-hidden p-0">
      {rows.map((row, index) => {
        const destructive = row.variant === 'destructive';
        const isInactive = row.disabled || row.loading;
        const labelColor = destructive
          ? colors.destructive
          : isInactive
            ? colors.textDisabled
            : colors.text;
        const showChevron = row.showChevron ?? true;
        const badgeColor = row.icon
          ? destructive
            ? colors.destructive
            : ICON_COLORS[row.icon]
          : colors.textMuted;

        return (
          <button
            key={row.id}
            type="button"
            onClick={row.onClick}
            disabled={row.disabled || row.loading}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            style={{
              borderBottomWidth: index < rows.length - 1 ? 1 : 0,
              borderBottomColor: colors.glassBorder,
            }}
          >
            <span className="flex min-w-0 items-center gap-3">
              {row.icon ? (
                <span
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: badgeColor, opacity: isInactive ? 0.55 : 1 }}
                >
                  <AppIcon icon={ICONS[row.icon]} size={15} color="#FFFFFF" />
                </span>
              ) : null}
              <span className="min-w-0">
                <span className="block text-sm font-medium" style={{ color: labelColor }}>
                  {row.label}
                </span>
                {row.subtitle ? (
                  <span className="mt-0.5 block text-xs" style={{ color: colors.textMuted }}>
                    {row.subtitle}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 pl-2">
              {row.badge && row.badge > 0 ? (
                <span
                  className="min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-xs font-bold text-white"
                  style={{ backgroundColor: colors.primaryBright }}
                >
                  {row.badge}
                </span>
              ) : null}
              {row.loading ? (
                <LoadingIndicator size="small" />
              ) : showChevron ? (
                <AppIcon icon={chevronForward} size={18} color={colors.textMuted} />
              ) : null}
            </span>
          </button>
        );
      })}
    </ThemedSurface>
  );
}
