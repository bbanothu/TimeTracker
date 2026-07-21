import { createElement, useLayoutEffect, type CSSProperties } from 'react';
import { defineCustomElement } from 'ionicons/components/ion-icon.js';

interface AppIconProps {
  /** Ionicons data URL from `ionicons/icons` (same set as the mobile app). */
  icon: string;
  size?: number;
  color: string;
  className?: string;
  style?: CSSProperties;
}

let defined = false;

function ensureIonIconDefined() {
  if (defined || typeof window === 'undefined') return;
  defineCustomElement();
  defined = true;
}

/** Renders an Ionicons glyph — same SF Symbol–style set as the mobile app. */
export function AppIcon({ icon, size = 22, color, className = '', style }: AppIconProps) {
  useLayoutEffect(() => {
    ensureIonIconDefined();
  }, []);
  ensureIonIconDefined();

  return createElement('ion-icon', {
    icon,
    class: `app-icon ${className}`.trim(),
    style: {
      display: 'block',
      width: size,
      height: size,
      color,
      verticalAlign: 'middle',
      ...style,
    },
    'aria-hidden': 'true',
  });
}
