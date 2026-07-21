import { StyleSheet } from 'react-native';

import type { AppColors } from '@/theme/colors';

export function getAuthScreenStyles(colors: AppColors) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 24,
    },
    hero: {
      marginBottom: 28,
    },
    kicker: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    title: {
      color: colors.text,
      fontSize: 40,
      fontWeight: '800',
      letterSpacing: -0.8,
      marginBottom: 8,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 17,
      lineHeight: 24,
    },
    card: {
      overflow: 'hidden',
      borderRadius: 16,
      backgroundColor: colors.surface,
    },
    cardInner: {
      padding: 20,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 6,
    },
    cardHint: {
      color: colors.textMuted,
      fontSize: 15,
      marginBottom: 18,
    },
    buttonWrap: {
      marginTop: 8,
      marginBottom: 16,
      borderRadius: 28,
      overflow: 'hidden',
    },
    button: {
      paddingVertical: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      color: colors.textOnPrimary,
      fontSize: 17,
      fontWeight: '700',
    },
    linkWrap: {
      alignItems: 'center',
      paddingVertical: 4,
    },
    linkText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}

/** Static layout-only styles for modules that cannot take colors. */
export const authScreenStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  hero: {
    marginBottom: 28,
  },
  buttonWrap: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 28,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});
