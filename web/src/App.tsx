import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useHashRouter } from '@/lib/isElectron';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { FriendsPage } from '@/pages/FriendsPage';
import { GoalProgressPage } from '@/pages/GoalProgressPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { LoginPage } from '@/pages/LoginPage';
import { MapPage } from '@/pages/MapPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StatsPage } from '@/pages/StatsPage';
import { TagsPage } from '@/pages/TagsPage';
import { TermsPage } from '@/pages/TermsPage';
import { TrackPage } from '@/pages/TrackPage';
import { ProtectedLayout } from '@/routes/ProtectedLayout';
import { PublicPageShell } from '@/routes/PublicPageShell';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Public App Store / marketing pages (no login required) */}
      <Route
        path="/support"
        element={
          <PublicPageShell>
            <ContactPage />
          </PublicPageShell>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicPageShell>
            <ContactPage />
          </PublicPageShell>
        }
      />
      <Route
        path="/privacy"
        element={
          <PublicPageShell>
            <PrivacyPage />
          </PublicPageShell>
        }
      />
      <Route
        path="/terms"
        element={
          <PublicPageShell>
            <TermsPage />
          </PublicPageShell>
        }
      />
      <Route element={<ProtectedLayout />}>
        <Route index element={<TrackPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="stats/progress" element={<GoalProgressPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/about" element={<AboutPage />} />
        <Route path="profile/contact" element={<ContactPage />} />
        <Route path="profile/support" element={<ContactPage />} />
        <Route path="profile/privacy" element={<PrivacyPage />} />
        <Route path="profile/terms" element={<TermsPage />} />
        <Route path="profile/friends" element={<FriendsPage />} />
        <Route path="profile/settings" element={<SettingsPage />} />
        <Route path="profile/password" element={<Navigate to="/profile/settings" replace />} />
        <Route path="profile/history" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  const Router = useHashRouter() ? HashRouter : BrowserRouter;

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
