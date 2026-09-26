import { ArrowUpRight, MapPin, Trophy, UsersRound } from "lucide-react";
import { Link } from "react-router";

export default function TeamCard({ team }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface motion-safe:transition-[transform,border-color,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 focus-within:border-primary/60">
      <div className="relative isolate flex h-44 items-center justify-center overflow-hidden border-b border-border bg-linear-to-br from-surface-hover to-background">
        <div aria-hidden="true" className="absolute -right-4 -z-10 h-72 w-20 rotate-30 bg-primary/10" />
        <span
          aria-hidden="true"
          className="font-[var(--font-discovery)] text-8xl italic tracking-wider text-primary/20 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110"
        >
          {team.initials}
        </span>

        <span className="absolute bottom-4 left-4 rounded-lg border border-border bg-background/90 px-3 py-1 text-xs font-semibold">
          {team.sportLabel}
        </span>

        {team.lookingForPlayers && (
          <span className="absolute top-4 right-4 rounded-lg bg-primary px-3 py-1 text-xs font-bold text-background">
            Recruiting
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-bold">{team.name}</h3>

        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <MapPin size={15} aria-hidden="true" />
          {Number.isFinite(team.distanceKm)
            ? `${team.distanceApproximate ? "About " : ""}${team.distanceKm} km away`
            : "Distance unavailable"}
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Trophy size={14} aria-hidden="true" />
            {team.skillLevel}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <UsersRound size={14} aria-hidden="true" />
            {team.memberCount} members
          </span>
        </div>

        {team.recommendationReasons?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {team.recommendationReasons.map((reason) => (
              <span key={reason} className="badge">{reason}</span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-6">
          <Link
            to={`/teams/${team.id}`}
            aria-label={`View ${team.name}`}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-background hover:bg-primary-hover motion-safe:transition-[background-color,transform] motion-safe:active:scale-[0.98]"
          >
            View team
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
