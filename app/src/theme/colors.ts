export { GOOGLE_EVENT_COLORS, TAG_COLOR_OPTIONS } from '@/constants/googleCalendarColors';

export interface AppColors {
  pageBg: string;
  primary: string;
  primaryBright: string;
  textOnPrimary: string;
  destructive: string;
  destructiveText: string;
  destructiveBg: string;
  destructiveBorder: string;
  surface: string;
  surfaceSolid: string;
  surfaceBorder: string;
  glass: string;
  glassBorder: string;
  separator: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textOnGlass: string;
  textOnBg: string;
  tabActive: string;
  tabInactive: string;
  tabBarBg: string;
  tabBarBorder: string;
  headerText: string;
  inputBg: string;
  inputBgSolid: string;
  inputBorder: string;
  inputPlaceholder: string;
  selectedBg: string;
  selectedBgSolid: string;
  selectedText: string;
  secondaryBg: string;
  secondaryBgSolid: string;
  secondaryText: string;
  chartPrimary: string;
  chartSecondary: string;
  chartText: string;
  blurIntensity: number;
  blurTint: 'light' | 'dark' | 'default';
  backgroundGradient: [string, string, string];
  authGradient: [string, string, string];
  stop: string;
  disabled: string;
  spinnerOnPrimary: string;
  switchTrackOff: string;
  switchTrackOn: string;
  overlay: string;
  authText: string;
  authTextSecondary: string;
  authTextMuted: string;
  authPlaceholder: string;
}

const ACCENT = '#FF9F0A';
const ACCENT_BRIGHT = '#FFB340';
const SECONDARY = '#8E8E93';

/** Frosted light — clear white glass over photo atmosphere */
export const lightColors: AppColors = {
  pageBg: '#E8E8ED',
  primary: ACCENT,
  primaryBright: ACCENT_BRIGHT,
  textOnPrimary: '#FFFFFF',
  destructive: '#FF3B30',
  destructiveText: '#FF3B30',
  destructiveBg: 'rgba(255, 59, 48, 0.12)',
  destructiveBorder: 'rgba(255, 59, 48, 0.28)',
  // Washes must stay nearly clear or BlurView looks like a gray slab
  surface: 'rgba(255, 255, 255, 0.18)',
  surfaceSolid: 'rgba(255, 255, 255, 0.5)',
  surfaceBorder: 'rgba(255, 255, 255, 0.55)',
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.65)',
  separator: 'rgba(60, 60, 67, 0.16)',
  text: '#000000',
  textSecondary: SECONDARY,
  textMuted: SECONDARY,
  textDisabled: '#C7C7CC',
  textOnGlass: '#000000',
  textOnBg: '#000000',
  tabActive: ACCENT,
  tabInactive: 'rgba(60, 60, 67, 0.55)',
  tabBarBg: 'rgba(255, 255, 255, 0.22)',
  tabBarBorder: 'rgba(255, 255, 255, 0.65)',
  headerText: '#000000',
  inputBg: 'rgba(255, 255, 255, 0.22)',
  inputBgSolid: 'rgba(255, 255, 255, 0.35)',
  inputBorder: 'rgba(255, 255, 255, 0.45)',
  inputPlaceholder: SECONDARY,
  selectedBg: 'rgba(255, 159, 10, 0.22)',
  selectedBgSolid: 'rgba(255, 232, 194, 0.7)',
  selectedText: '#000000',
  secondaryBg: 'rgba(255, 255, 255, 0.18)',
  secondaryBgSolid: 'rgba(255, 255, 255, 0.35)',
  secondaryText: '#000000',
  chartPrimary: ACCENT,
  chartSecondary: ACCENT_BRIGHT,
  chartText: '#000000',
  blurIntensity: 32,
  blurTint: 'light',
  backgroundGradient: [
    'rgba(255, 255, 255, 0.28)',
    'rgba(242, 242, 247, 0.4)',
    'rgba(255, 255, 255, 0.5)',
  ],
  authGradient: [ACCENT_BRIGHT, ACCENT, '#E68600'],
  stop: '#FF3B30',
  disabled: '#C7C7CC',
  spinnerOnPrimary: '#FFFFFF',
  switchTrackOff: '#E9E9EB',
  switchTrackOn: ACCENT,
  overlay: 'rgba(0, 0, 0, 0.4)',
  authText: '#000000',
  authTextSecondary: SECONDARY,
  authTextMuted: SECONDARY,
  authPlaceholder: SECONDARY,
};

/** Frosted dark — translucent white glass (not charcoal fill) over photo */
export const darkColors: AppColors = {
  pageBg: '#000000',
  primary: ACCENT,
  primaryBright: ACCENT_BRIGHT,
  textOnPrimary: '#000000',
  destructive: '#FF453A',
  destructiveText: '#FF453A',
  destructiveBg: 'rgba(255, 69, 58, 0.15)',
  destructiveBorder: 'rgba(255, 69, 58, 0.35)',
  surface: 'rgba(255, 255, 255, 0.08)',
  surfaceSolid: 'rgba(255, 255, 255, 0.14)',
  surfaceBorder: 'rgba(255, 255, 255, 0.2)',
  glass: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.22)',
  separator: 'rgba(255, 255, 255, 0.14)',
  text: '#FFFFFF',
  textSecondary: SECONDARY,
  textMuted: SECONDARY,
  textDisabled: '#636366',
  textOnGlass: '#FFFFFF',
  textOnBg: '#FFFFFF',
  tabActive: ACCENT,
  tabInactive: 'rgba(235, 235, 245, 0.55)',
  tabBarBg: 'rgba(255, 255, 255, 0.1)',
  tabBarBorder: 'rgba(255, 255, 255, 0.28)',
  headerText: '#FFFFFF',
  inputBg: 'rgba(255, 255, 255, 0.1)',
  inputBgSolid: 'rgba(255, 255, 255, 0.12)',
  inputBorder: 'rgba(255, 255, 255, 0.2)',
  inputPlaceholder: SECONDARY,
  selectedBg: 'rgba(255, 159, 10, 0.22)',
  selectedBgSolid: 'rgba(58, 42, 10, 0.65)',
  selectedText: '#FFFFFF',
  secondaryBg: 'rgba(255, 255, 255, 0.1)',
  secondaryBgSolid: 'rgba(255, 255, 255, 0.14)',
  secondaryText: '#FFFFFF',
  chartPrimary: ACCENT,
  chartSecondary: ACCENT_BRIGHT,
  chartText: '#FFFFFF',
  blurIntensity: 38,
  blurTint: 'dark',
  backgroundGradient: ['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.72)'],
  authGradient: [ACCENT_BRIGHT, ACCENT, '#E68600'],
  stop: '#FF453A',
  disabled: '#636366',
  spinnerOnPrimary: '#000000',
  switchTrackOff: '#39393D',
  switchTrackOn: ACCENT,
  overlay: 'rgba(0, 0, 0, 0.65)',
  authText: '#FFFFFF',
  authTextSecondary: SECONDARY,
  authTextMuted: SECONDARY,
  authPlaceholder: SECONDARY,
};
