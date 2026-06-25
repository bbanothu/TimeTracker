import type { ButtonHTMLAttributes, CSSProperties } from 'react';

import { useAppColors } from '@/contexts/ThemeContext';

type Variant = 'primary' | 'secondary' | 'destructive' | 'destructiveOutline';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  loading?: boolean;
}

export function ActionButton({
  label,
  variant = 'primary',
  loading,
  disabled,
  className = '',
  ...props
}: ActionButtonProps) {
  const colors = useAppColors();

  const styles: Record<Variant, CSSProperties> = {
    primary: { backgroundColor: colors.primary, color: colors.textOnPrimary },
    secondary: { backgroundColor: colors.secondaryBgSolid, color: colors.secondaryText },
    destructive: { backgroundColor: colors.stop, color: '#fff' },
    destructiveOutline: {
      backgroundColor: colors.destructiveBg,
      color: colors.destructiveText,
      border: `1px solid ${colors.destructiveBorder}`,
    },
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 ${className}`}
      style={styles[variant]}
    >
      {loading ? 'Please wait…' : label}
    </button>
  );
}
