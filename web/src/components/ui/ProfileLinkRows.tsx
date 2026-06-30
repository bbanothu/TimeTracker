import { useAppColors } from '@/contexts/ThemeContext';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { ThemedSurface } from '@/components/ui/ThemedSurface';

export type ProfileLinkIcon =
  'friends' | 'history' | 'password' | 'sync' | 'export' | 'clear' | 'signout';

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

function LockIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FriendsIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke={color} strokeWidth="2" />
      <path
        d="M3 19v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 4.5a2.5 2.5 0 0 1 0 5M19 19v-1a3.5 3.5 0 0 0-2.5-3.36"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HistoryIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
      <path d="M12 8v4l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SyncIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 0 1 13.7-5.7M20 12a8 8 0 0 1-13.7 5.7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M16 4h4v4M8 20H4v-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ExportIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v10M8 9l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function TrashIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SignOutIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth="2" />
      <path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function RowIcon({ icon, color }: { icon: ProfileLinkIcon; color: string }) {
  switch (icon) {
    case 'password':
      return <LockIcon color={color} />;
    case 'friends':
      return <FriendsIcon color={color} />;
    case 'history':
      return <HistoryIcon color={color} />;
    case 'sync':
      return <SyncIcon color={color} />;
    case 'export':
      return <ExportIcon color={color} />;
    case 'clear':
      return <TrashIcon color={color} />;
    case 'signout':
      return <SignOutIcon color={color} />;
  }
}

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
        const iconColor = destructive
          ? colors.destructive
          : isInactive
            ? colors.textDisabled
            : colors.textMuted;
        const showChevron = row.showChevron ?? true;

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
                <span className="shrink-0">
                  <RowIcon icon={row.icon} color={iconColor} />
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
                <span className="text-base" style={{ color: colors.textMuted }}>
                  ›
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </ThemedSurface>
  );
}
