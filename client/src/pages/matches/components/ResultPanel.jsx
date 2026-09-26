import { api } from "../../../lib/api";
import { id } from "../../../utils/data";
import { useResource } from "../../../hooks/useResource";
import { Form, Field, Action } from "../../../components/ui/Form";
import { State, Badge } from "../../../components/ui/Feedback";

export default function ResultPanel({ match, leaderTeam }) {
  const resource = useResource(`/results/matches/${id(match)}`, { interval: 30000 });
  const result = resource.data;
  const canSubmit = leaderTeam && match.status === "scheduled" && new Date(match.endsAt) <= new Date() && (!result || result.status === "disputed");
  const canCorrect = Boolean(leaderTeam && match.status === "completed" && result?.status === "confirmed" && !result.correctionProposal);

  const scoreForm = (submit, title) => <Form submit={submit} action={(values) => api.post("/results", {
    matchId: id(match),
    homeScore: Number(values.homeScore),
    awayScore: Number(values.awayScore),
    notes: values.notes.trim(),
  })}>
    {title && <h3 className="font-bold">{title}</h3>}
    <div className="grid grid-cols-2 gap-3">
      <Field label="Home score" type="number" step={1} name="homeScore" required min={0} max={100000} />
      <Field label="Away score" type="number" step={1} name="awayScore" required min={0} max={100000} />
    </div>
    <Field label="Match notes"><textarea name="notes" maxLength={1000} /></Field>
  </Form>;

  return <section className="panel stack">
    <h2 className="section-title">The scorecard</h2>
    <State resource={resource} />
    {result && <>
      <p className="font-display text-6xl font-bold text-primary">{result.homeScore} <span className="text-muted/50">:</span> {result.awayScore}</p>
      <p className="text-xs text-muted">Home score · Away score</p>
      <Badge>{result.status}</Badge>
      <p className="whitespace-pre-wrap text-sm text-muted">{result.notes}</p>
    </>}
    {result?.correctionProposal && <div className="rounded-xl border border-border bg-background p-4 stack">
      <h3 className="font-bold">Score correction proposed</h3>
      <p className="font-display text-3xl text-primary">{result.correctionProposal.homeScore} : {result.correctionProposal.awayScore}</p>
      <p className="text-xs text-muted">The current confirmed score remains the source of statistics until the opposing leader confirms this correction.</p>
    </div>}
    {canSubmit && !resource.loading && !resource.error && scoreForm("Submit result")}
    {canCorrect && scoreForm("Propose score correction", "Correct a confirmed score")}
    {leaderTeam && result?.status === "pending" && id(result.submittedByTeam) !== leaderTeam && <div className="row">
      {["confirmed", "disputed"].map((decision) => <Action key={decision} action={() => api.patch(`/results/${id(result)}`, { decision })}>{decision === "confirmed" ? "Confirm result" : "Dispute result"}</Action>)}
    </div>}
    {leaderTeam && result?.correctionProposal && id(result.correctionProposal.proposedByTeam) !== leaderTeam && <div className="row">
      <Action action={() => api.patch(`/results/${id(result)}`, { decision: "confirmed" })}>Confirm correction</Action>
      <Action danger action={() => api.patch(`/results/${id(result)}`, { decision: "disputed" })}>Reject correction</Action>
    </div>}
    {leaderTeam && result?.correctionProposal && id(result.correctionProposal.proposedByTeam) === leaderTeam && <p className="text-sm text-muted">Waiting for the opposing leader to review this correction.</p>}
    {!result && !canSubmit && !resource.loading && !resource.error && <p className="text-sm leading-relaxed text-muted">{match.status === "cancelled" ? "This match was cancelled." : "A team leader can submit the score after the match ends. The opposing leader then confirms it."}</p>}
  </section>;
}
