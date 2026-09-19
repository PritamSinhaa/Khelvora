import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router";

export default function UpcomingMatchCard() {
  return (
    <section
      aria-labelledby="upcoming-match-heading"
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="flex items-center justify-between gap-3 p-5">
        <h2
          id="upcoming-match-heading"
          className="text-lg font-bold tracking-tight"
        >
          Upcoming match
        </h2>

        <span className="rounded-md bg-surface-hover px-2 py-1 text-xs text-muted">
          Preview
        </span>
      </div>

      <div className="mx-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-linear-to-br from-surface-hover to-background px-4 py-6">
        <div className="flex flex-1 flex-col items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 font-display text-2xl italic text-primary"
          >
            MU
          </span>

          <span className="text-center text-xs font-semibold">
            Mohali United
          </span>
        </div>

        <span className="font-display text-3xl italic text-primary">
          VS
        </span>

        <div className="flex flex-1 flex-col items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-xl border border-border bg-surface-hover font-display text-2xl italic"
          >
            CF
          </span>

          <span className="text-center text-xs font-semibold">
            City FC
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-sm font-semibold">Friendly football match</p>

        <div className="space-y-3 text-sm text-muted">
          <p className="flex items-start gap-2">
            <CalendarDays
              size={17}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            Saturday, 6:00 PM
          </p>

          <p className="flex items-start gap-2">
            <MapPin
              size={17}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            Sector 78 Sports Ground
          </p>
        </div>

        <Link
          to="/matches"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-background hover:bg-primary-hover motion-safe:transition-colors"
        >
          Go to matches
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}