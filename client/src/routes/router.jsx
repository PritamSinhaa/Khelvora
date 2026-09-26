import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";

import AppLayout from "../layouts/AppLayout";
import AuthLayout from "../layouts/AuthLayout";
import PublicLayout from "../layouts/PublicLayout";
import AdminLayout from "../layouts/AdminLayout";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

import HomePage from "../pages/public/HomePage";
import AuthPage from "../pages/auth/AuthPage";
import NotFound from "../pages/NotFound";

const TeamsPage = lazy(() => import("../pages/teams/TeamsPage"));
const TeamEditorPage = lazy(() => import("../pages/teams/TeamEditorPage"));
const TeamDetailsPage = lazy(() => import("../pages/teams/TeamDetailsPage"));

const MatchesPage = lazy(() => import("../pages/matches/MatchesPage"));
const MatchDetailsPage = lazy(
  () => import("../pages/matches/MatchDetailsPage"),
);

const ChallengesPage = lazy(
  () => import("../pages/challenges/ChallengesPage"),
);

const MessagesPage = lazy(() => import("../pages/messages/MessagesPage"));

const ProfilePage = lazy(
  () => import("../features/profiles/ProfilePage"),
);
const PlayerPage = lazy(
  () => import("../features/profiles/PlayerPage"),
);

const OnboardingPage = lazy(
  () => import("../pages/onboarding/OnboardingPage"),
);
const NotificationsPage = lazy(
  () => import("../pages/notifications/NotificationsPage"),
);
const OpenGamesPage = lazy(
  () => import("../pages/open-games/OpenGamesPage"),
);
const SettingsPage = lazy(
  () => import("../pages/settings/SettingsPage"),
);
const ReportsPage = lazy(
  () => import("../pages/admin/ReportsPage"),
);
const TeamLeaderboardPage = lazy(() => import("../pages/statistics/TeamLeaderboardPage"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-muted" role="status">
          Getting the game ready…
        </div>
      }
    >
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<AuthPage />} />
          <Route path="register" element={<AuthPage register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/discover" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="discover" element={<HomePage />} />

            <Route path="teams" element={<TeamsPage />} />
            <Route path="teams/new" element={<TeamEditorPage />} />
            <Route path="teams/:teamId" element={<TeamDetailsPage />} />
            <Route path="teams/:teamId/edit" element={<TeamEditorPage />} />

            <Route path="matches" element={<MatchesPage />} />
            <Route path="leaderboards" element={<TeamLeaderboardPage />} />
            <Route
              path="matches/:matchId"
              element={<MatchDetailsPage />}
            />

            <Route path="challenges" element={<ChallengesPage />} />

            <Route path="messages" element={<MessagesPage />} />
            <Route
              path="messages/:conversationId"
              element={<MessagesPage />}
            />

            <Route path="profile" element={<ProfilePage />} />
            <Route path="players/:userId" element={<PlayerPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />

            <Route
              path="notifications"
              element={<NotificationsPage />}
            />
            <Route path="open-games" element={<OpenGamesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="reports" element={<ReportsPage />} />

            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route
                  path="admin/reports"
                  element={<ReportsPage />}
                />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
