import { useAppColors, useTheme } from '@/contexts/ThemeContext';

function SunIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DarkModeToggle({ size = 52 }: { size?: number }) {
  const colors = useAppColors();
  const { isDark, toggle } = useTheme();
  const iconSize = Math.max(18, Math.round(size * 0.42));

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex shrink-0 items-center justify-center rounded-full border transition hover:opacity-90"
      style={{
        width: size,
        height: size,
        borderColor: colors.glassBorder,
        color: colors.text,
        backgroundColor: 'transparent',
      }}
    >
      {isDark ? <SunIcon color={colors.text} size={iconSize} /> : <MoonIcon color={colors.text} size={iconSize} />}
    </button>
  );
}
