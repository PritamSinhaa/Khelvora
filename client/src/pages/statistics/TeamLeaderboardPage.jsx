import { useState } from "react";
import { Link } from "react-router";
import { query } from "../../lib/api";
import { id, rows } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { Empty, PageHeader, Pager, State } from "../../components/ui/Feedback";
import { Field } from "../../components/ui/Form";

export default function TeamLeaderboardPage() {
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [season, setSeason] = useState(String(new Date().getUTCFullYear()));
  const [page, setPage] = useState(1);
  const sports = useResource("/sports");
  const leaderboard = useResource(sport ? query("/statistics/leaderboards/teams", { sport, city, season, page, limit: 20 }) : null);
  const items = rows(leaderboard.data);

  return <div className="stack">
    <PageHeader title="Team leaderboards" eyebrow="Across the season" description="Results are ranked within one sport at a time." />
    <section className="panel stack">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Sport"><select value={sport} onChange={(event) => { setSport(event.target.value); setPage(1); }}><option value="">Choose a sport</option>{rows(sports.data).map((item) => <option key={id(item)} value={id(item)}>{item.name}</option>)}</select></Field>
        <Field label="City (optional)" value={city} onChange={(event) => { setCity(event.target.value); setPage(1); }} placeholder="Any city" />
        <Field label="Season (UTC calendar year)" type="number" min={2000} max={2100} value={season} onChange={(event) => { setSeason(event.target.value); setPage(1); }} />
      </div>
      <p className="text-xs text-muted">Eligibility: at least 5 completed matches with confirmed results in the selected sport and season. Ranking: wins, win percentage, draws, then fewer losses; exact ties use team name. Scores are not compared across sports.</p>
    </section>
    <State resource={leaderboard} />
    {sport && items.length > 0 && <section className="panel overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted"><th className="p-3">Rank</th><th className="p-3">Team</th><th className="p-3">City</th><th className="p-3">Played</th><th className="p-3">W</th><th className="p-3">D</th><th className="p-3">L</th><th className="p-3">Win %</th></tr></thead><tbody>
        {items.map((team, index) => <tr className="border-b border-border last:border-0" key={id(team.teamId)}><td className="p-3 font-bold">{(page - 1) * 20 + index + 1}</td><td className="p-3"><Link className="font-semibold text-primary hover:underline" to={`/teams/${id(team.teamId)}`}>{team.teamName}</Link></td><td className="p-3">{team.city}</td><td className="p-3">{team.completedMatches}</td><td className="p-3">{team.wins}</td><td className="p-3">{team.draws}</td><td className="p-3">{team.losses}</td><td className="p-3">{team.winPercentage}%</td></tr>)}
      </tbody></table>
    </section>}
    {sport && !leaderboard.loading && !leaderboard.error && !items.length && <Empty title="No eligible teams yet">Teams need at least five completed matches with confirmed results in this sport and season.</Empty>}
    {!sport && <Empty title="Choose a sport">Leaderboards stay separate because the app has no cross-sport normalization.</Empty>}
    <Pager page={page} setPage={setPage} count={items.length} limit={20} loading={leaderboard.loading} hasNext={page * 20 < (leaderboard.data?.total || 0)} />
  </div>;
}
