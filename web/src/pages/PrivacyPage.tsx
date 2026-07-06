import { LegalPageLayout, LegalSection } from '@/components/layout/LegalPageLayout';
import { useAppColors } from '@/contexts/ThemeContext';

const SUPPORT_EMAIL = 'bbanothu1997@gmail.com';

export function PrivacyPage() {
  const colors = useAppColors();

  return (
    <LegalPageLayout title="Privacy Policy" updated="July 5, 2026">
      <p>
        Tempo (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the app&rdquo;) helps you track how
        you spend your time. This policy explains what we collect, how we use it, and your choices.
      </p>

      <LegalSection title="Information we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account information</strong> — email, password, optional name and profile
            photo
          </li>
          <li>
            <strong>Time tracking data</strong> — tags, session times, optional notes, manual vs.
            geofence source
          </li>
          <li>
            <strong>Location data</strong> — with permission, for maps, saved places, auto-tracking,
            and optional stop coordinates (mobile)
          </li>
          <li>
            <strong>Goals and stats</strong> — daily targets and progress derived from your entries
          </li>
          <li>
            <strong>Social features</strong> — friend requests and friendships when you use Friends
          </li>
          <li>
            <strong>Device data</strong> — notification tokens (mobile) and app preferences such as
            theme
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use information">
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide sign-in, sync, and core tracking features</li>
          <li>Run optional place-based auto-tracking when you enable it</li>
          <li>Show stats, goals, history, and maps</li>
          <li>Enable optional friend features</li>
          <li>Improve reliability and fix errors</li>
        </ul>
        <p className="mt-2">We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection title="Where data is stored">
        <p>
          Account and synced data are stored in Supabase (database and file storage). On mobile,
          data is also kept locally in SQLite and synced when online.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul className="list-disc space-y-1 pl-5">
          <li>Revoke location or notification permissions in device settings</li>
          <li>Disable saved places or background auto-tracking in the app</li>
          <li>Export entries as CSV from Account</li>
          <li>Delete individual entries from History</li>
          <li>
            Request account deletion by emailing{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="underline-offset-2 hover:underline"
              style={{ color: colors.primaryBright }}
            >
              {SUPPORT_EMAIL}
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Privacy questions:{' '}
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
