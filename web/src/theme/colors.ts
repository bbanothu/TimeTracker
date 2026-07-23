import { DEFAULT_TAG_COLORS } from '@/constants/googleCalendarColors';

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
