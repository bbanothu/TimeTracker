import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useHashRouter } from '@/lib/isElectron';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { FriendsPage } from '@/pages/FriendsPage';
import { GoalProgressPage } from '@/pages/GoalProgressPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { LoginPage } from '@/pages/LoginPage';
import { MapPage } from '@/pages/MapPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { StatsPage } from '@/pages/StatsPage';
import { TagsPage } from '@/pages/TagsPage';
import { TrackPage } from '@/pages/TrackPage';
import { ProtectedLayout } from '@/routes/ProtectedLayout';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<TrackPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="stats/progress" element={<GoalProgressPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/friends" element={<FriendsPage />} />
        <Route path="profile/password" element={<ChangePasswordPage />} />
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
