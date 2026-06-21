import { useTheme } from '@/contexts/ThemeContext';

export function DarkModeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur"
      style={{
        borderColor: 'rgba(255,255,255,0.2)',
        color: isDark ? '#FAFAF9' : '#1C1917',
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
      }}
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
