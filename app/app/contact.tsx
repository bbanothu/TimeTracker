import { Linking } from 'react-native';

import {
  LegalLink,
  LegalParagraph,
  LegalScreenLayout,
  LegalSection,
} from '@/components/LegalScreenLayout';
import { SUPPORT_EMAIL } from '@/constants/support';

export default function ContactScreen() {
  return (
    <LegalScreenLayout>
      <LegalParagraph>
        Questions about TimeTracker, your account, or a bug you hit? Reach out — we read every message.
      </LegalParagraph>

      <LegalSection title="Email">
        <LegalLink
          label={SUPPORT_EMAIL}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
        <LegalParagraph>
          Include your account email and, if relevant, your device and app version. For data
          deletion requests, put "Delete my account" in the subject line.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Response time">
        <LegalParagraph>
          We aim to reply within a few business days. For urgent account access issues, mention
          that in your subject line.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Feedback">
        <LegalParagraph>
          Feature ideas and usability feedback are welcome. TimeTracker is actively developed, and user
          input helps us prioritize what to build next.
        </LegalParagraph>
      </LegalSection>
    </LegalScreenLayout>
  );
}
