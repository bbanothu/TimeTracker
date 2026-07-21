import {
  flag,
  flagOutline,
  map,
  mapOutline,
  person,
  personOutline,
  pricetags,
  pricetagsOutline,
  statsChart,
  statsChartOutline,
  timer,
  timerOutline,
} from 'ionicons/icons';

import { AppIcon } from '@/components/ui/AppIcon';
import type { mainNavTabs } from '@/config/nav';

export type NavIconName = (typeof mainNavTabs)[number]['icon'] | 'account';

const NAV_ICONS: Record<NavIconName, { active: string; inactive: string }> = {
  timer: { active: timer, inactive: timerOutline },
  tags: { active: pricetags, inactive: pricetagsOutline },
  map: { active: map, inactive: mapOutline },
  stats: { active: statsChart, inactive: statsChartOutline },
  goals: { active: flag, inactive: flagOutline },
  account: { active: person, inactive: personOutline },
};

export function NavIcon({
  name,
  color,
  size = 22,
  active = false,
}: {
  name: NavIconName;
  color: string;
  size?: number;
  active?: boolean;
}) {
  const icons = NAV_ICONS[name];
  return <AppIcon icon={active ? icons.active : icons.inactive} size={size} color={color} />;
}
