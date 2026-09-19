import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../features/auth/useAuth";
import { Notice } from "../components/ui/Feedback";

export default function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <p role="status" className="text-muted">
          Loading your account…
        </p>
      </main>
    );
  }

  if (!auth.token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (auth.error) {
    return (
      <main className="panel mx-auto my-20 max-w-lg stack">
        <h1 className="section-title">Let’s get you connected</h1>
        <Notice error>{auth.error}</Notice>

        <button className="btn" onClick={auth.retry}>
          Retry connection
        </button>

        <button className="btn secondary" onClick={auth.clearSession}>
          Return to sign in
        </button>
      </main>
    );
  }

  return auth.user ? <Outlet /> : null;
}