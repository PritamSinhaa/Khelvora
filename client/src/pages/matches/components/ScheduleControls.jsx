import { api } from "../../../lib/api";
import { id, dateTime, scheduleFrom } from "../../../utils/data";
import { Form, Action } from "../../../components/ui/Form";
import ScheduleFields from "../../../components/common/ScheduleFields";

export default function ScheduleControls({ match, leaderTeam }) {
  if (
    !leaderTeam ||
    match.status !== "scheduled" ||
    new Date(match.startsAt) <= new Date()
  ) {
    return null;
  }

  const proposal = match.scheduleProposal;

  return (
    <section className="panel stack">
      <h2 className="section-title">Schedule & venue</h2>

      {proposal ? (
        <>
          <p className="text-sm text-muted">Proposed schedule change</p>
          <p>
            {dateTime(proposal.startsAt)} – {dateTime(proposal.endsAt)}
          </p>
          <p className="text-sm">{proposal.venue?.name}</p>
          <p className="text-sm text-muted">{proposal.venue?.address}</p>

          {id(proposal.proposedByTeam) !== leaderTeam ? (
            <div className="row">
              {["accepted", "rejected"].map((decision) => (
                <Action
                  key={decision}
                  action={() =>
                    api.patch(`/matches/${id(match)}/schedule`, {
                      decision,
                    })
                  }
                >
                  {decision === "accepted" ? "Accept change" : "Reject change"}
                </Action>
              ))}
            </div>
          ) : (
            <p className="notice">Waiting for the opposing team leader.</p>
          )}
        </>
      ) : (
        <details>
          <summary className="cursor-pointer text-sm font-bold text-primary">
            Propose a different time or venue
          </summary>

          <Form
            className="mt-5"
            submit="Propose schedule change"
            action={(values) =>
              api.post(`/matches/${id(match)}/schedule`, scheduleFrom(values))
            }
          >
            <ScheduleFields initial={match} />
          </Form>
        </details>
      )}

      <Action
        danger
        confirm="Cancel this scheduled match?"
        action={() => api.post(`/matches/${id(match)}/cancel`)}
      >
        Cancel match
      </Action>
    </section>
  );
}
