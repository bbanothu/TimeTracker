export interface AppColors {
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
  blurTint: 'light' | 'dark';
  backgroundGradient: [string, string, string];
  authGradient: [string, string, string];
  stop: string;
  disabled: string;
  spinnerOnPrimary: string;
  switchTrackOff: string;
  overlay: string;
  authText: string;
  authTextSecondary: string;
  authTextMuted: string;
  authPlaceholder: string;
}

/** Warm botanical palette — cream surfaces, emerald accents */
export const lightColors: AppColors = {
  primary: '#047857',
  primaryBright: '#10B981',
  textOnPrimary: '#FFFFFF',
  destructive: '#DC2626',
  destructiveText: '#B91C1C',
  destructiveBg: 'rgba(220, 38, 38, 0.1)',
  destructiveBorder: 'rgba(220, 38, 38, 0.25)',
  surface: 'rgba(255, 252, 245, 0.88)',
  surfaceSolid: '#FFFCF5',
  surfaceBorder: 'rgba(68, 64, 60, 0.1)',
  glass: 'rgba(255, 252, 245, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.65)',
  text: '#1C1917',
  textSecondary: '#1C1917',
  textMuted: '#1C1917',
  textDisabled: '#78716C',
  textOnGlass: '#1C1917',
  textOnBg: '#1C1917',
  tabActive: '#059669',
  tabInactive: '#A8A29E',
  tabBarBg: 'rgba(255, 252, 245, 0.82)',
  tabBarBorder: 'rgba(68, 64, 60, 0.08)',
  headerText: '#1C1917',
  inputBg: 'rgba(255, 255, 255, 0.75)',
  inputBgSolid: '#FFFFFF',
  inputBorder: 'rgba(68, 64, 60, 0.12)',
  inputPlaceholder: '#A8A29E',
  selectedBg: 'rgba(5, 150, 105, 0.16)',
  selectedBgSolid: '#D1FAE5',
  selectedText: '#047857',
  secondaryBg: 'rgba(68, 64, 60, 0.08)',
  secondaryBgSolid: '#E7E5E4',
  secondaryText: '#1C1917',
  chartPrimary: '#059669',
  chartSecondary: '#34D399',
  chartText: '#1C1917',
  blurIntensity: 32,
  blurTint: 'light',
  backgroundGradient: [
    'rgba(254, 243, 199, 0.25)',
    'rgba(255, 252, 245, 0.5)',
    'rgba(231, 229, 228, 0.78)',
  ],
  authGradient: ['#6EE7B7', '#059669', '#047857'],
  stop: '#DC2626',
  disabled: '#A8A29E',
  spinnerOnPrimary: '#FFFFFF',
  switchTrackOff: '#D6D3D1',
  overlay: 'rgba(0, 0, 0, 0.65)',
  authText: '#FFFFFF',
  authTextSecondary: '#F5F5F4',
  authTextMuted: '#D6D3D1',
  authPlaceholder: '#A8A29E',
};

/** Warm ember palette — stone dark surfaces, amber/coral accents */
export const darkColors: AppColors = {
  primary: '#FB923C',
  primaryBright: '#FDBA74',
  textOnPrimary: '#1C1917',
  destructive: '#FB7185',
  destructiveText: '#FECDD3',
  destructiveBg: 'rgba(251, 113, 133, 0.15)',
  destructiveBorder: 'rgba(251, 113, 133, 0.35)',
  surface: 'rgba(28, 25, 23, 0.78)',
  surfaceSolid: '#1C1917',
  surfaceBorder: 'rgba(255, 255, 255, 0.1)',
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.16)',
  text: '#FAFAF9',
  textSecondary: '#D6D3D1',
  textMuted: '#A8A29E',
  textDisabled: '#78716C',
  textOnGlass: '#FAFAF9',
  textOnBg: '#FAFAF9',
  tabActive: '#FB923C',
  tabInactive: '#A8A29E',
  tabBarBg: 'rgba(28, 25, 23, 0.92)',
  tabBarBorder: 'rgba(255, 255, 255, 0.1)',
  headerText: '#FAFAF9',
  inputBg: 'rgba(255, 255, 255, 0.08)',
  inputBgSolid: '#292524',
  inputBorder: 'rgba(255, 255, 255, 0.18)',
  inputPlaceholder: '#78716C',
  selectedBg: 'rgba(251, 146, 60, 0.2)',
  selectedBgSolid: '#422006',
  selectedText: '#FED7AA',
  secondaryBg: 'rgba(255, 255, 255, 0.1)',
  secondaryBgSolid: '#292524',
  secondaryText: '#E7E5E4',
  chartPrimary: '#FB923C',
  chartSecondary: '#FDBA74',
  chartText: '#D6D3D1',
  blurIntensity: 52,
  blurTint: 'dark',
  backgroundGradient: [
    'rgba(28, 25, 23, 0.18)',
    'rgba(41, 37, 36, 0.58)',
    'rgba(28, 25, 23, 0.92)',
  ],
  authGradient: ['#FDBA74', '#FB923C', '#EA580C'],
  stop: '#FB7185',
  disabled: '#78716C',
  spinnerOnPrimary: '#1C1917',
  switchTrackOff: '#57534E',
  overlay: 'rgba(0, 0, 0, 0.75)',
  authText: '#FFFFFF',
  authTextSecondary: '#F5F5F4',
  authTextMuted: '#D6D3D1',
  authPlaceholder: '#A8A29E',
};

/** Default tag picker swatches — no blue */
export const TAG_COLOR_OPTIONS = [
  '#059669',
  '#65A30D',
  '#0D9488',
  '#0891B2',
  '#D97706',
  '#EA580C',
  '#CA8A04',
  '#DC2626',
  '#E11D48',
  '#DB2777',
  '#C026D3',
  '#9333EA',
  '#7C3AED',
  '#44403C',
] as const;
