import { LegalPageLayout, LegalSection } from '@/components/layout/LegalPageLayout';

export function AboutPage() {
  return (
    <LegalPageLayout title="About">
      <p>
        Tempo helps you understand how you spend your time. Tag activities, set daily goals, and
        optionally let saved places auto-start tracking when you arrive. Stats, history, and
        progress sync across your devices.
      </p>

      <LegalSection title="What Tempo does">
        <ul className="list-disc space-y-1 pl-5">
          <li>Manual and automatic time tracking with hierarchical tags</li>
          <li>Daily goals and progress history by category</li>
          <li>Saved places on a map with optional geofence auto-tracking (mobile)</li>
          <li>Stats, heatmaps, and CSV export</li>
          <li>Optional friends feature to compare stats</li>
        </ul>
      </LegalSection>

      <LegalSection title="Who we are">
        <p>
          Tempo is built by QCSmallBusiness — a small team focused on practical tools that help
          people spend time more intentionally, without adding friction to their day.
        </p>
      </LegalSection>

      <LegalSection title="Platforms">
        <p>
          Tempo is available on the web, as a desktop app, and on iOS and Android. Mobile apps
          support background location for place-based auto-tracking; the web and desktop clients
          sync your data and provide full stats and map views.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
