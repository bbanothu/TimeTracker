import { useAppColors } from '@/contexts/ThemeContext';
import { ThemedSurface } from '@/components/ui/ThemedSurface';

export type ProfileLinkIcon = 'friends' | 'history' | 'password';

export interface ProfileLinkRow {
  id: string;
  label: string;
  onClick: () => void;
  badge?: number;
  icon?: ProfileLinkIcon;
}

function LockIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
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

function RowIcon({ icon, color }: { icon: ProfileLinkIcon; color: string }) {
  switch (icon) {
    case 'password':
      return <LockIcon color={color} />;
    case 'friends':
      return <FriendsIcon color={color} />;
    case 'history':
      return <HistoryIcon color={color} />;
  }
}

interface ProfileLinkRowsProps {
  rows: ProfileLinkRow[];
}

export function ProfileLinkRows({ rows }: ProfileLinkRowsProps) {
  const colors = useAppColors();

  return (
    <ThemedSurface className="mb-4 overflow-hidden p-0">
      {rows.map((row, index) => (
        <button
          key={row.id}
          type="button"
          onClick={row.onClick}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
          style={{
            borderBottomWidth: index < rows.length - 1 ? 1 : 0,
            borderBottomColor: colors.glassBorder,
          }}
        >
          <span className="flex min-w-0 items-center gap-3">
            {row.icon ? (
              <span className="shrink-0" style={{ color: colors.textMuted }}>
                <RowIcon icon={row.icon} color={colors.textMuted} />
              </span>
            ) : null}
            <span className="text-sm font-medium" style={{ color: colors.text }}>
              {row.label}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {row.badge && row.badge > 0 ? (
              <span
                className="min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-xs font-bold text-white"
                style={{ backgroundColor: colors.primaryBright }}
              >
                {row.badge}
              </span>
            ) : null}
            <span className="text-base" style={{ color: colors.textMuted }}>
              ›
            </span>
          </span>
        </button>
      ))}
    </ThemedSurface>
  );
}
