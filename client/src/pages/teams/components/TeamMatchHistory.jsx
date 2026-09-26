import { useState } from "react";
import { Link } from "react-router";
import { query } from "../../../lib/api";
import { id, rows, dateTime } from "../../../utils/data";
import { useResource } from "../../../hooks/useResource";
import { Badge, Empty, Pager, State } from "../../../components/ui/Feedback";
import { Field } from "../../../components/ui/Form";

export default function TeamMatchHistory({ teamId }) {
  const [page, setPage] = useState(1);
  const [sport, setSport] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const sports = useResource("/sports");
  const history = useResource(query(`/teams/${teamId}/history`, { page, limit: 10, sport, from, to }));
  const items = rows(history.data);

  return <section className="panel stack">
    <div><h2 className="section-title">Match history</h2><p className="text-sm text-muted">Only completed matches with confirmed results are included. Dates use UTC for filtering and your local time for display.</p></div>
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Sport"><select value={sport} onChange={(event) => { setSport(event.target.value); setPage(1); }}><option value="">All sports</option>{rows(sports.data).map((item) => <option key={id(item)} value={id(item)}>{item.name}</option>)}</select></Field>
      <Field label="From date" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
      <Field label="Through date" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
    </div>
    <State resource={history} />
    <div className="stack">
      {items.map((match) => <article className="list-item" key={id(match.matchId)}>
        <div><p className="font-semibold">vs <Link className="text-primary hover:underline" to={`/teams/${id(match.opponent)}`}>{match.opponent?.name}</Link></p><p className="mt-1 text-xs text-muted">{dateTime(match.startsAt)} · {match.sport?.name}{match.isHome ? " · Home" : " · Away"}</p></div>
        <div className="row"><span className="font-display text-2xl">{match.homeScore} : {match.awayScore}</span><Badge>{match.outcome}</Badge></div>
      </article>)}
    </div>
    {!history.loading && !history.error && !items.length && <Empty title="No confirmed results in this range">Pending, disputed, cancelled, and unreported matches are excluded.</Empty>}
    <Pager page={page} setPage={setPage} count={items.length} limit={10} loading={history.loading} hasNext={page * 10 < (history.data?.total || 0)} />
  </section>;
}
