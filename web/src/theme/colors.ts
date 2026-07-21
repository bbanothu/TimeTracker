import { DEFAULT_TAG_COLORS } from '@/constants/googleCalendarColors';

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
  authGradient: [string, string, string];
  backgroundGradient: [string, string, string];
  stop: string;
  disabled: string;
  spinnerOnPrimary: string;
  overlay: string;
  authText: string;
  authTextSecondary: string;
  authTextMuted: string;
  authPlaceholder: string;
}

const ACCENT = '#FF9F0A';
const ACCENT_BRIGHT = '#FFB340';
const SECONDARY = '#8E8E93';

/** Frosted light — glassy washes over the photo, black text */
export const lightColors: AppColors = {
  pageBg: '#F2F2F7',
  primary: ACCENT,
  primaryBright: ACCENT_BRIGHT,
  textOnPrimary: '#FFFFFF',
  destructive: '#FF3B30',
  destructiveText: '#FF3B30',
  destructiveBg: 'rgba(255, 59, 48, 0.12)',
  destructiveBorder: 'rgba(255, 59, 48, 0.28)',
  surface: 'rgba(255, 255, 255, 0.28)',
  surfaceSolid: 'rgba(255, 255, 255, 0.45)',
  surfaceBorder: 'rgba(255, 255, 255, 0.55)',
  glass: 'rgba(255, 255, 255, 0.18)',
  glassBorder: 'rgba(255, 255, 255, 0.65)',
  separator: 'rgba(60, 60, 67, 0.16)',
  text: '#000000',
  textSecondary: '#000000',
  textMuted: '#000000',
  textDisabled: '#000000',
  textOnBg: '#000000',
  tabActive: ACCENT,
  tabInactive: '#000000',
  tabBarBg: 'rgba(255, 255, 255, 0.28)',
  tabBarBorder: 'rgba(255, 255, 255, 0.55)',
  headerText: '#000000',
  inputBg: 'rgba(255, 255, 255, 0.32)',
  inputBgSolid: 'rgba(255, 255, 255, 0.4)',
  inputBorder: 'rgba(255, 255, 255, 0.5)',
  inputPlaceholder: '#000000',
  selectedBg: 'rgba(255, 159, 10, 0.22)',
  selectedBgSolid: 'rgba(255, 232, 194, 0.7)',
  selectedText: '#000000',
  secondaryBg: 'rgba(255, 255, 255, 0.22)',
  secondaryBgSolid: 'rgba(255, 255, 255, 0.35)',
  secondaryText: '#000000',
  chartPrimary: ACCENT,
  authGradient: [ACCENT_BRIGHT, ACCENT, '#E68600'],
  backgroundGradient: ['transparent', 'transparent', 'transparent'],
  stop: '#FF3B30',
  disabled: '#C7C7CC',
  spinnerOnPrimary: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.4)',
  authText: '#000000',
  authTextSecondary: '#000000',
  authTextMuted: '#000000',
  authPlaceholder: '#000000',
};

/** OLED dark — translucent white glass over photo */
export const darkColors: AppColors = {
  pageBg: '#000000',
  primary: ACCENT,
  primaryBright: ACCENT_BRIGHT,
  textOnPrimary: '#000000',
  destructive: '#FF453A',
  destructiveText: '#FF453A',
  destructiveBg: 'rgba(255, 69, 58, 0.15)',
  destructiveBorder: 'rgba(255, 69, 58, 0.35)',
  surface: 'rgba(255, 255, 255, 0.12)',
  surfaceSolid: 'rgba(255, 255, 255, 0.16)',
  surfaceBorder: 'rgba(255, 255, 255, 0.28)',
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.28)',
  separator: 'rgba(255, 255, 255, 0.14)',
  text: '#FFFFFF',
  textSecondary: SECONDARY,
  textMuted: SECONDARY,
  textDisabled: '#636366',
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
  authGradient: [ACCENT_BRIGHT, ACCENT, '#E68600'],
  backgroundGradient: ['rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.72)'],
  stop: '#FF453A',
  disabled: '#636366',
  spinnerOnPrimary: '#000000',
  overlay: 'rgba(0, 0, 0, 0.65)',
  authText: '#FFFFFF',
  authTextSecondary: SECONDARY,
  authTextMuted: SECONDARY,
  authPlaceholder: SECONDARY,
};

export const DEFAULT_TAGS = [
  { name: 'work', color: DEFAULT_TAG_COLORS.work },
  { name: 'personal', color: DEFAULT_TAG_COLORS.personal },
  { name: 'sleep', color: DEFAULT_TAG_COLORS.sleep },
] as const;
