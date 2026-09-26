import { useState } from "react";
import { id, rows, dateTime } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { query } from "../../lib/api";
import { Badge, Empty, Pager, State } from "../../components/ui/Feedback";

export default function PlayerMatchHistory() {
  const [page, setPage] = useState(1);
  const history = useResource(query("/users/me/match-history", { page, limit: 10 }));
  const items = rows(history.data);
  return <section className="panel stack">
    <div><h2 className="section-title">Your match history</h2><p className="text-sm text-muted">Appearances come from saved match rosters or an earlier “I’m playing” response. Current team membership is never used to recreate the past. Individual goals, points, and other performance stats are not recorded.</p></div>
    <State resource={history} />
    {items.map((match) => <article className="list-item" key={id(match.matchId)}>
      <div><p className="font-semibold">{match.home?.name} vs {match.away?.name}</p><p className="mt-1 text-xs text-muted">{dateTime(match.startsAt)} · {match.sport?.name} · {match.participationSource}</p></div>
      <div className="row"><span className="font-display text-2xl">{match.homeScore} : {match.awayScore}</span>{match.playerResult && <Badge>{match.playerResult}</Badge>}</div>
    </article>)}
    {!history.loading && !history.error && !items.length && <Empty title="No recorded match history yet">Older matches without a saved roster or “I’m playing” attendance response cannot be attributed to you.</Empty>}
    <Pager page={page} setPage={setPage} count={items.length} limit={10} loading={history.loading} hasNext={page * 10 < (history.data?.total || 0)} />
  </section>;
}
