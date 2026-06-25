export const mainNavTabs = [
  { to: '/', label: 'Track', icon: '⏱' },
  { to: '/tags', label: 'Tags', icon: '🏷' },
  { to: '/map', label: 'Map', icon: '📍' },
  { to: '/stats', label: 'Stats', icon: '📊' },
  { to: '/goals', label: 'Goals', icon: '🎯' },
] as const;

export const accountNavItem = { to: '/profile', label: 'Account', icon: '👤' } as const;
