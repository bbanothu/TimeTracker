import { Link } from 'react-router-dom';

import { LegalPageLayout, LegalSection } from '@/components/layout/LegalPageLayout';
import { useAppColors } from '@/contexts/ThemeContext';

const SUPPORT_EMAIL = 'bbanothu1997@gmail.com';

export function TermsPage() {
  const colors = useAppColors();

  return (
    <LegalPageLayout title="Terms of Service" updated="July 5, 2026">
      <p>
        By using TimeTracker, you agree to these terms. If you do not agree, do not use the service.
      </p>

      <LegalSection title="The service">
        <p>
          TimeTracker provides time-tracking tools including tags, goals, statistics, saved places, and
          optional location-based auto-tracking. Features vary by platform. We may update or
          discontinue features with reasonable notice when possible.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You are responsible for keeping your login credentials secure and for activity under your
          account. Provide accurate registration information. You must be at least 13 years old to
          use TimeTracker.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Use TimeTracker for unlawful purposes or to violate others&apos; rights</li>
          <li>Attempt to access another user&apos;s data without authorization</li>
          <li>Interfere with or disrupt the service or its infrastructure</li>
          <li>Reverse engineer or scrape the service except where permitted by law</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You retain ownership of the data you enter (time entries, tags, notes, etc.). You grant us
          a limited license to store, process, and display that data solely to operate TimeTracker for
          you, including sync and backup.
        </p>
      </LegalSection>

      <LegalSection title="Location and auto-tracking">
        <p>
          Place-based auto-tracking uses your device location only when you enable it. You are
          responsible for complying with local laws and workplace policies regarding location
          tracking. TimeTracker is not liable for tracking started or stopped incorrectly due to GPS
          inaccuracy, device settings, or network conditions.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          TimeTracker is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee
          uninterrupted or error-free service. Time totals and stats are estimates based on your
          inputs and device data.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, QCSmallBusiness is not liable for indirect,
          incidental, or consequential damages arising from your use of TimeTracker. Our total liability
          is limited to the amount you paid us in the past twelve months (or zero for free use).
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You may stop using TimeTracker and delete your account at any time. We may suspend or terminate
          access for violations of these terms or to protect the service.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update these terms. Continued use after changes constitutes acceptance. Material
          changes will be reflected on this page with an updated date.
        </p>
      </LegalSection>

      <LegalSection title="Privacy">
        <p>
          Our{' '}
          <Link
            to="/profile/privacy"
            className="underline-offset-2 hover:underline"
            style={{ color: colors.primaryBright }}
          >
            Privacy Policy
          </Link>{' '}
          describes how we handle your data.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms:{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline-offset-2 hover:underline"
            style={{ color: colors.primaryBright }}
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
