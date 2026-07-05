import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { useAppColors } from '@/contexts/ThemeContext';

export function AppBootSplash() {
  const colors = useAppColors();

  return (
    <div className="flex min-h-[40vh] flex-col py-16">
      <div className="flex flex-1 items-end justify-center pb-3">
        <h1 className="text-3xl font-semibold tracking-wide" style={{ color: colors.text }}>
          TimeTracker
        </h1>
      </div>
      <div className="flex items-center justify-center">
        <LoadingIndicator size="large" />
      </div>
      <div className="flex-1" />
    </div>
  );
}
