import { useRouter } from 'expo-router';
import { Linking, Text } from 'react-native';

import {
  LegalBulletList,
  LegalLink,
  LegalParagraph,
  LegalScreenLayout,
  LegalSection,
} from '@/components/LegalScreenLayout';
import { SUPPORT_EMAIL } from '@/constants/support';
import { useAppColors } from '@/hooks/useAppColors';

export default function TermsScreen() {
  const router = useRouter();
  const colors = useAppColors();

  return (
    <LegalScreenLayout updated="July 5, 2026">
      <LegalParagraph>
        By using TimeTracker, you agree to these terms. If you do not agree, do not use the service.
      </LegalParagraph>

      <LegalSection title="The service">
        <LegalParagraph>
          TimeTracker provides time-tracking tools including tags, goals, statistics, saved places,
          and optional location-based auto-tracking. Features vary by platform. We may update or
          discontinue features with reasonable notice when possible.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Your account">
        <LegalParagraph>
          You are responsible for keeping your login credentials secure and for activity under your
          account. Provide accurate registration information. You must be at least 13 years old to
          use TimeTracker.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <LegalParagraph>You agree not to:</LegalParagraph>
        <LegalBulletList
          items={[
            "Use TimeTracker for unlawful purposes or to violate others' rights",
            "Attempt to access another user's data without authorization",
            'Interfere with or disrupt the service or its infrastructure',
            'Reverse engineer or scrape the service except where permitted by law',
          ]}
        />
      </LegalSection>

      <LegalSection title="Your content">
        <LegalParagraph>
          You retain ownership of the data you enter (time entries, tags, notes, etc.). You grant us
          a limited license to store, process, and display that data solely to operate TimeTracker
          for you, including sync and backup.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Location and auto-tracking">
        <LegalParagraph>
          Place-based auto-tracking uses your device location only when you enable it. You are
          responsible for complying with local laws and workplace policies regarding location
          tracking. TimeTracker is not liable for tracking started or stopped incorrectly due to GPS
          inaccuracy, device settings, or network conditions.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <LegalParagraph>
          TimeTracker is provided "as is" without warranties of any kind. We do not guarantee
          uninterrupted or error-free service. Time totals and stats are estimates based on your
          inputs and device data.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <LegalParagraph>
          To the maximum extent permitted by law, QCSmallBusiness is not liable for indirect,
          incidental, or consequential damages arising from your use of TimeTracker. Our total
          liability is limited to the amount you paid us in the past twelve months (or zero for free
          use).
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Termination">
        <LegalParagraph>
          You may stop using TimeTracker and delete your account at any time. We may suspend or
          terminate access for violations of these terms or to protect the service.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Changes">
        <LegalParagraph>
          We may update these terms. Continued use after changes constitutes acceptance. Material
          changes will be reflected on this page with an updated date.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Privacy">
        <Text className="text-sm leading-6" style={{ color: colors.textSecondary }}>
          Our <LegalLink label="Privacy Policy" onPress={() => router.push('/privacy')} /> describes
          how we handle your data.
        </Text>
      </LegalSection>

      <LegalSection title="Contact">
        <LegalParagraph>
          Questions about these terms:{' '}
          <LegalLink
            label={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
        </LegalParagraph>
      </LegalSection>
    </LegalScreenLayout>
  );
}
