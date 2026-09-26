import {
  ArrowUpRight,
  MapPin,
  Trophy,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router";

import { id } from "../../../utils/data";
import TeamCover from "../../teams/components/TeamCover";

export default function TeamCard({ team }) {
  const hasDistance =
    team.distanceKm !== null &&
    team.distanceKm !== undefined;

  const recruiting =
    team.lookingForPlayers &&
    team.memberCount < team.maxMembers;

  const sportLabel =
    team.sportLabel ||
    (typeof team.sport === "object"
      ? team.sport?.name
      : null) ||
    "Team sport";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface motion-safe:transition-[transform,border-color,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 focus-within:border-primary/60">
      <TeamCover
        src={team.coverUrl}
        name={team.name}
        className="h-44 border-b border-border"
      >
        <span className="absolute bottom-4 left-4 rounded-lg border border-border bg-background/90 px-3 py-1 text-xs font-semibold">
          {sportLabel}
        </span>

        {recruiting && (
          <span className="absolute top-4 right-4 rounded-lg bg-primary px-3 py-1 text-xs font-bold text-background">
            Recruiting
          </span>
        )}
      </TeamCover>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="break-words text-xl font-bold">
          {team.name}
        </h3>

        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <MapPin
            size={15}
            aria-hidden="true"
            className="shrink-0"
          />

          <span>
            {hasDistance
              ? `${team.distanceKm} km away`
              : team.city || "Location not specified"}
          </span>
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

        <div className="mt-auto pt-6">
          <Link
            to={`/teams/${id(team)}`}
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