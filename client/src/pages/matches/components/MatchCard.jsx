import { Link } from "react-router";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";
import { id, dateTime } from "../../../utils/data";
import { Badge } from "../../../components/ui/Feedback";
import EntityName from "../../../components/common/EntityName";

export default function MatchCard({ match }) {
  return (
    <Link
      to={`/matches/${id(match)}`}
      className="group panel stack transition-colors hover:border-primary/50"
    >
      <div className="between">
        <Badge>{match.status}</Badge>
        <ArrowUpRight
          size={18}
          className="text-muted group-hover:text-primary"
        />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-border bg-background px-3 py-6">
        <h2 className="text-center text-sm font-bold sm:text-base">
          <EntityName value={match.homeTeam} />
        </h2>

        <span className="font-display text-3xl italic text-primary">
          VS
        </span>

        <h2 className="text-center text-sm font-bold sm:text-base">
          <EntityName value={match.awayTeam} />
        </h2>
      </div>

      <p className="flex items-center gap-2 text-sm">
        <CalendarDays size={16} className="text-primary" />
        {dateTime(match.startsAt)}
      </p>

      <p className="flex items-center gap-2 text-sm text-muted">
        <MapPin size={16} />
        {match.venue?.name}
      </p>
    </Link>
  );
}