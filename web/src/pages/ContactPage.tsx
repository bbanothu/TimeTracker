import { LegalPageLayout, LegalSection } from '@/components/layout/LegalPageLayout';
import { useAppColors } from '@/contexts/ThemeContext';
import { useLocation } from 'react-router-dom';

const SUPPORT_EMAIL = 'bbanothu1997@gmail.com';

export function ContactPage() {
  const colors = useAppColors();
  const { pathname } = useLocation();
  const isPublic = pathname === '/support' || pathname === '/contact';
  const isSupport = pathname.includes('support');

  return (
    <LegalPageLayout
      title={isSupport ? 'Support' : 'Contact'}
      backLink={isPublic ? { to: '/login', label: '← Sign in' } : undefined}
    >
      <p>
        Questions about TimeTracker, your account, or a bug you hit? Reach out — we read every
        message.
      </p>

      <LegalSection title="Email">
        <p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium underline-offset-2 hover:underline"
            style={{ color: colors.primaryBright }}
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="mt-2">
          Include your account email and, if relevant, your device and app version. For data
          deletion requests, put &ldquo;Delete my account&rdquo; in the subject line.
        </p>
      </LegalSection>

      <LegalSection title="Response time">
        <p>
          We aim to reply within a few business days. For urgent account access issues, mention that
          in your subject line.
        </p>
      </LegalSection>

      <LegalSection title="Feedback">
        <p>
          Feature ideas and usability feedback are welcome. TimeTracker is actively developed, and
          user input helps us prioritize what to build next.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
