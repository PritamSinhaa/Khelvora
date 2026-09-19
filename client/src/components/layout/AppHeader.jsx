import { Bell, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router";

import Logo from "../common/Logo";
import ProfileSection from "./ProfileSection";
import TeamSearch from "../../features/discovery/components/TeamSearch";

export default function AppHeader({
  search,
  onSearchChange,
  user,
}) {
  const { pathname } = useLocation();
  const isDiscoveryPage = pathname === "/discover";

  const locationLabel =
    user?.city || "Set your location in your profile";

  return (
    <header className="sticky top-0 z-30 bg-background lg:border-b lg:border-border">
      <div className="flex h-20 items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          to="/discover"
          aria-label="Khelvora discovery"
          className="shrink-0 lg:hidden"
        >
          <Logo />
        </Link>

        <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
          <MapPin
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <span className="text-sm font-medium">
            {locationLabel}
          </span>
        </div>

        <div className="hidden min-w-0 max-w-xl flex-1 lg:block">
          {isDiscoveryPage && (
            <TeamSearch
              id="desktop-team-search"
              value={search}
              onChange={onSearchChange}
            />
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center">
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="hidden size-11 items-center justify-center rounded-xl hover:bg-surface-hover hover:text-primary motion-safe:transition-colors lg:flex"
          >
            <Bell
              size={23}
              strokeWidth={1.6}
              aria-hidden="true"
            />
          </Link>

          <div className="lg:hidden">
            <ProfileSection user={user} compact />
          </div>
        </div>
      </div>

      {isDiscoveryPage && (
        <p className="flex items-center gap-2 px-4 pb-3 text-xs sm:px-6 lg:hidden">
          <MapPin size={16} aria-hidden="true" />
          {locationLabel}
        </p>
      )}
    </header>
  );
}