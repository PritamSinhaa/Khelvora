import { Link, Outlet } from "react-router";

import { useAuth } from "../features/auth/useAuth";
import Logo from "../components/common/Logo";

export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border">
        <div className="between mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <Link
            to={user ? "/discover" : "/login"}
            aria-label="Khelvora home"
          >
            <Logo />
          </Link>

          <nav className="row" aria-label="Public navigation">
            {user ? (
              <Link to="/discover" className="btn">
                Open Khelvora
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn secondary">
                  Sign in
                </Link>

                <Link to="/register" className="btn">
                  Join the crew
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted">
        Khelvora · Local teams. More game time.
      </footer>
    </div>
  );
}