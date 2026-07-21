import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { SettingsGroup } from '@/components/SettingsGroup';
import { SettingsRow } from '@/components/SettingsRow';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type ProfileLinkIcon =
  | 'friends'
  | 'history'
  | 'password'
  | 'autotracking'
  | 'calendar'
  | 'sync'
  | 'export'
  | 'clear'
  | 'deleteAccount'
  | 'signout';

export interface ProfileLinkRow {
  id: string;
  label: string;
  onPress?: () => void;
  badge?: number;
  icon?: ProfileLinkIcon;
  subtitle?: string;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  toggle?: {
    value: boolean;
    onValueChange: (value: boolean) => void;
  };
}

const ICONS: Record<ProfileLinkIcon, IoniconName> = {
  friends: 'people',
  history: 'time',
  password: 'lock-closed',
  autotracking: 'navigate',
  calendar: 'calendar',
  sync: 'cloud-upload',
  export: 'download',
  clear: 'trash',
  deleteAccount: 'person-remove',
  signout: 'log-out',
};

const ICON_COLORS: Record<ProfileLinkIcon, string> = {
  friends: '#007AFF',
  history: '#5856D6',
  password: '#8E8E93',
  autotracking: '#34C759',
  calendar: '#FF9500',
  sync: '#32ADE6',
  export: '#AF52DE',
  clear: '#FF3B30',
  deleteAccount: '#FF3B30',
  signout: '#FF3B30',
};

interface ProfileLinkRowsProps {
  rows: ProfileLinkRow[];
}

export function ProfileLinkRows({ rows }: ProfileLinkRowsProps) {
  return (
    <SettingsGroup>
      {rows.map((row, index) => (
        <SettingsRow
          key={row.id}
          label={row.label}
          onPress={row.onPress}
          badge={row.badge}
          icon={row.icon ? ICONS[row.icon] : undefined}
          iconColor={row.icon ? ICON_COLORS[row.icon] : undefined}
          subtitle={row.subtitle}
          variant={row.variant}
          loading={row.loading}
          disabled={row.disabled}
          showChevron={row.showChevron}
          showSeparator={index < rows.length - 1}
          toggle={row.toggle}
        />
      ))}
    </SettingsGroup>
  );
}
