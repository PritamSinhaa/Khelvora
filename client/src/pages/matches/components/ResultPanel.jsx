import { api } from "../../../lib/api";
import { id } from "../../../utils/data";
import { useResource } from "../../../hooks/useResource";
import { Form, Field, Action } from "../../../components/ui/Form";
import { State, Badge } from "../../../components/ui/Feedback";

export default function ResultPanel({ match, leaderTeam }) {
  const resource = useResource(`/results/matches/${id(match)}`, {
    interval: 30000,
  });

  const result = resource.data;

  const canSubmit =
    leaderTeam &&
    match.status === "scheduled" &&
    new Date(match.endsAt) <= new Date() &&
    (!result || result.status === "disputed");

  return (
    <section className="panel stack">
      <h2 className="section-title">The scorecard</h2>
      <State resource={resource} />

      {result && (
        <>
          <p className="font-display text-6xl font-bold text-primary">
            {result.homeScore} <span className="text-muted/50">:</span>{" "}
            {result.awayScore}
          </p>
          <p className="text-xs text-muted">Home score · Away score</p>
          <Badge>{result.status}</Badge>
          <p className="whitespace-pre-wrap text-sm text-muted">
            {result.notes}
          </p>
        </>
      )}

      {canSubmit && !resource.loading && !resource.error && (
        <Form
          submit="Submit result"
          action={(values) =>
            api.post("/results", {
              matchId: id(match),
              homeScore: Number(values.homeScore),
              awayScore: Number(values.awayScore),
              notes: values.notes.trim(),
            })
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Home score"
              type="number"
              step={1}
              name="homeScore"
              required
              min={0}
              max={100000}
            />
            <Field
              label="Away score"
              type="number"
              step={1}
              name="awayScore"
              required
              min={0}
              max={100000}
            />
          </div>

          <Field label="Match notes">
            <textarea name="notes" maxLength={1000} />
          </Field>
        </Form>
      )}

      {leaderTeam &&
        result?.status === "pending" &&
        id(result.submittedByTeam) !== leaderTeam && (
          <div className="row">
            {["confirmed", "disputed"].map((decision) => (
              <Action
                key={decision}
                action={() => api.patch(`/results/${id(result)}`, { decision })}
              >
                {decision === "confirmed" ? "Confirm result" : "Dispute result"}
              </Action>
            ))}
          </div>
        )}

      {!result && !canSubmit && !resource.loading && !resource.error && (
        <p className="text-sm leading-relaxed text-muted">
          {match.status === "cancelled"
            ? "This match was cancelled."
            : "A team leader can submit the score after the match ends. The opposing leader then confirms it."}
        </p>
      )}
    </section>
  );
}
