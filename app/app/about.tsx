import {
  LegalBulletList,
  LegalParagraph,
  LegalScreenLayout,
  LegalSection,
} from '@/components/LegalScreenLayout';

export default function AboutScreen() {
  return (
    <LegalScreenLayout>
      <LegalParagraph>
        TimeTracker helps you understand how you spend your time. Tag activities, set daily goals, and
        optionally let saved places auto-start tracking when you arrive. Stats, history, and
        progress sync across your devices.
      </LegalParagraph>

      <LegalSection title="What TimeTracker does">
        <LegalBulletList
          items={[
            'Manual and automatic time tracking with hierarchical tags',
            'Daily goals and progress history by category',
            'Saved places on a map with optional geofence auto-tracking (mobile)',
            'Stats and CSV export',
            'Optional friends feature to compare stats',
          ]}
        />
      </LegalSection>

      <LegalSection title="Who we are">
        <LegalParagraph>
          TimeTracker is built by QCSmallBusiness — a small team focused on practical tools that help
          people spend time more intentionally, without adding friction to their day.
        </LegalParagraph>
      </LegalSection>

      <LegalSection title="Platforms">
        <LegalParagraph>
          TimeTracker is available on the web, as a desktop app, and on iOS and Android. Mobile apps
          support background location for place-based auto-tracking; the web and desktop clients
          sync your data and provide full stats and map views.
        </LegalParagraph>
      </LegalSection>
    </LegalScreenLayout>
  );
}
