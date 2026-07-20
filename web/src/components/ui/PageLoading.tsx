import { LoadingIndicator, type LoadingIndicatorSize } from '@/components/ui/LoadingIndicator';
import { useAppColors } from '@/contexts/ThemeContext';

interface PageLoadingProps {
  message?: string;
  size?: LoadingIndicatorSize;
  className?: string;
}

export function PageLoading({ message, size = 'medium', className = '' }: PageLoadingProps) {
  const colors = useAppColors();

  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <LoadingIndicator size={size} />
      {message ? (
        <p className="text-sm" style={{ color: colors.textMuted }}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
