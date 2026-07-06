import { Linking, Text } from 'react-native';

import {
  LegalBulletList,
  LegalParagraph,
  LegalScreenLayout,
  LegalSection,
} from '@/components/LegalScreenLayout';
import { SUPPORT_EMAIL } from '@/constants/support';
import { useAppColors } from '@/hooks/useAppColors';

export default function PrivacyScreen() {
  const colors = useAppColors();

  return (
    <LegalScreenLayout updated="July 5, 2026">
      <LegalParagraph>
        Tempo ("we," "our," or "the app") helps you track how you spend your time. This policy
        explains what we collect, how we use it, and your choices.
      </LegalParagraph>

      <LegalSection title="Information we collect">
        <LegalBulletList
          items={[
            'Account information — email, password, optional name and profile photo',
            'Time tracking data — tags, session times, optional notes, manual vs. geofence source',
            'Location data — with permission, for maps, saved places, auto-tracking, and optional stop coordinates',
            'Goals and stats — daily targets and progress derived from your entries',
            'Social features — friend requests and friendships when you use Friends',
            'Device data — notification tokens and app preferences such as theme',
          ]}
        />
      </LegalSection>

      <LegalSection title="How we use information">
        <LegalBulletList
          items={[
            'Provide sign-in, sync, and core tracking features',
            'Run optional place-based auto-tracking when you enable it',
            'Show stats, goals, history, and maps',
            'Enable optional friend features',
            'Improve reliability and fix errors',
          ]}
        />
        <LegalParagraph>We do not sell your personal information.</LegalParagraph>
      </LegalSection>

      <LegalSection title="Where data is stored">
        <LegalParagraph>
          Account and synced data are stored in Supabase (database and file storage). On mobile,
          data is also kept locally in SQLite and synced when online.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Your choices">
        <LegalBulletList
          items={[
            'Revoke location or notification permissions in device settings',
            'Disable saved places or background auto-tracking in the app',
            'Export entries as CSV from Account',
            'Delete individual entries from History',
            `Request account deletion by emailing ${SUPPORT_EMAIL}`,
          ]}
        />
      </LegalSection>

      <LegalSection title="Contact">
        <Text className="text-sm leading-6" style={{ color: colors.textSecondary }}>
          Privacy questions:{' '}
          <Text
            className="font-medium"
            style={{ color: colors.primary }}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            {SUPPORT_EMAIL}
          </Text>
        </Text>
      </LegalSection>
    </LegalScreenLayout>
  );
}
