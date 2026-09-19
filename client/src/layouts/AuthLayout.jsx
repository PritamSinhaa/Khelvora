import { Link, Outlet } from "react-router";

import Logo from "../components/common/Logo";
import SportsArt from "../components/common/SportsArt";

export default function AuthLayout() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-border bg-surface p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-45"
        >
          <SportsArt scene="hero" className="h-full w-full" />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/30 to-background/30"
        />

        <Link
          to="/login"
          aria-label="Khelvora sign in"
          className="relative self-start"
        >
          <Logo />
        </Link>

        <div className="relative mt-40">
          <p className="eyebrow mb-6">
            Your next game starts here
          </p>

          <p className="font-display text-7xl leading-[.95] font-black uppercase italic">
            Find your crew.
            <br />
            <span className="text-primary">
              Own the game.
            </span>
          </p>

          <p className="mt-6 max-w-md text-muted">
            Meet local players, build your team, and turn
            “we should play” into a match on the calendar.
          </p>
        </div>

        <p className="relative mt-12 text-xs text-muted">
          Local teams. Real connections. More game time.
        </p>
      </section>

      <section className="flex min-w-0 flex-col items-center justify-center px-5 py-12 sm:px-12">
        <Link
          to="/login"
          aria-label="Khelvora sign in"
          className="mb-10 lg:hidden"
        >
          <Logo />
        </Link>

        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </section>
    </main>
  );
}