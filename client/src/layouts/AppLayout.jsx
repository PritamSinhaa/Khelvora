import { useState } from "react";
import { Link, Outlet } from "react-router";

import { useAuth } from "../features/auth/useAuth";
import Logo from "../components/common/Logo";
import AppHeader from "../components/layout/AppHeader";
import AppNavigation from "../components/layout/AppNavigation";
import ProfileSection from "../components/layout/ProfileSection";

export default function AppLayout() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-dvh w-full bg-background lg:grid lg:grid-cols-[208px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-3 font-semibold text-background focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <aside className="hidden border-r border-border lg:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-24 shrink-0 items-center px-5">
            <Link
              to="/discover"
              aria-label="Khelvora discovery"
            >
              <Logo />
            </Link>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <AppNavigation />
          </div>

          <div className="shrink-0">
            <ProfileSection user={user} />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <AppHeader
          search={search}
          onSearchChange={setSearch}
          user={user}
        />

        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 lg:px-7 lg:pb-8"
        >
          <Outlet context={{ search, setSearch }} />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <AppNavigation variant="mobile" />
      </div>
    </div>
  );
}