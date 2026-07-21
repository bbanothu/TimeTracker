export const mainNavTabs = [
  { to: '/', label: 'Track', icon: 'timer' },
  { to: '/tags', label: 'Tags', icon: 'tags' },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/stats', label: 'Stats', icon: 'stats' },
  { to: '/goals', label: 'Goals', icon: 'goals' },
] as const;

export const accountNavItem = { to: '/profile', label: 'Account', icon: 'account' } as const;
