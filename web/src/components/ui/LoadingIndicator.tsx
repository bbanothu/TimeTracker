import Lottie from 'lottie-react';

import loadingAnimation from '@/assets/loading_1.json';

export type LoadingIndicatorSize = 'small' | 'medium' | 'large' | number;

const SIZE_MAP = {
  small: 28,
  medium: 64,
  large: 220,
} as const;

interface LoadingIndicatorProps {
  size?: LoadingIndicatorSize;
  className?: string;
  label?: string;
}

export function LoadingIndicator({
  size = 'medium',
  className = '',
  label = 'Loading',
}: LoadingIndicatorProps) {
  const dimension = typeof size === 'number' ? size : SIZE_MAP[size];

  return (
    <div
      className={className}
      style={{ width: dimension, height: dimension }}
      role="progressbar"
      aria-label={label}
    >
      <Lottie animationData={loadingAnimation} loop autoplay style={{ width: dimension, height: dimension }} />
    </div>
  );
}
