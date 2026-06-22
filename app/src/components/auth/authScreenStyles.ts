import { StyleSheet } from 'react-native';

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
  kicker: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    lineHeight: 24,
  },
  card: {
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cardInner: {
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardHint: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 16,
    marginBottom: 18,
  },
  buttonWrap: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  linkWrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
});
