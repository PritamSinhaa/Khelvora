import { Link } from "react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { useResource } from "../../../hooks/useResource";
import { id, rows, dateTime } from "../../../utils/data";
import { State } from "../../../components/ui/Feedback";
import EntityName from "../../../components/common/EntityName";

export default function UpcomingMatchCard() {
  const matches = useResource("/matches?page=1&limit=50", {
    interval: 30000,
  });

  const match = rows(matches.data).find(
    (item) => item.status === "scheduled" && new Date(item.endsAt) > new Date(),
  );

  return (
    <section className="panel stack">
      <div className="between">
        <h2 className="section-title">Match day</h2>
        <CalendarDays size={18} className="text-primary" />
      </div>

      <State resource={matches} />

      {match ? (
        <>
          <div className="rounded-xl border border-border bg-background px-4 py-6 text-center">
            <p className="font-bold">
              <EntityName value={match.homeTeam} />
            </p>
            <p className="my-2 font-display text-3xl italic text-primary">VS</p>
            <p className="font-bold">
              <EntityName value={match.awayTeam} />
            </p>
          </div>

          <p className="text-sm text-muted">{dateTime(match.startsAt)}</p>

          <p className="flex items-center gap-2 text-sm text-muted">
            <MapPin size={15} />
            {match.venue?.name}
          </p>

          <Link className="btn" to={`/matches/${id(match)}`}>
            View match →
          </Link>
        </>
      ) : (
        !matches.loading &&
        !matches.error && (
          <>
            <p className="text-sm leading-relaxed text-muted">
              Find your schedule and match details in one place.
            </p>
            <Link className="btn secondary" to="/matches">
              View all matches →
            </Link>
          </>
        )
      )}
    </section>
  );
}
