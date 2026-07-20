import { useAppColors } from '@/contexts/ThemeContext';

export type MapViewMode = 'places' | 'heatmap';

interface MapModeToggleProps {
  mode: MapViewMode;
  onChange: (mode: MapViewMode) => void;
}

const MODES: { value: MapViewMode; label: string }[] = [
  { value: 'places', label: 'Places' },
  { value: 'heatmap', label: 'Heatmap' },
];

export function MapModeToggle({ mode, onChange }: MapModeToggleProps) {
  const colors = useAppColors();

  return (
    <div
      className="mb-4 inline-flex rounded-xl border p-1"
      style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder }}
    >
      {MODES.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className="rounded-lg px-4 py-2 text-sm font-semibold lg:px-5"
          style={{
            backgroundColor: mode === item.value ? colors.selectedBg : 'transparent',
            color: mode === item.value ? colors.selectedText : colors.textMuted,
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
