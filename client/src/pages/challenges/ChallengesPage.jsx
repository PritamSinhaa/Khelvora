import { useState } from "react";
import { Link } from "react-router";
import { api, query } from "../../lib/api";
import { id, rows, dateTime } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { useAuth } from "../../features/auth/useAuth";
import {
  State,
  Empty,
  PageHeader,
  Pager,
  Badge,
} from "../../components/ui/Feedback";
import { Action } from "../../components/ui/Form";
import EntityName from "../../components/common/EntityName";

export default function ChallengesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const resource = useResource(query("/challenges", { page, limit: 20 }), {
    interval: 30000,
  });
  const mine = useResource("/teams/mine");

  const led = new Set(
    rows(mine.data)
      .filter((team) => id(team.leader) === id(user))
      .map(id),
  );

  return (
    <div className="stack">
      <PageHeader
        title="Challenge accepted?"
        eyebrow="Team challenges"
        description="Set the time. Pick the ground. Bring your best game."
      >
        <Link className="btn" to="/discover">
          Find a rival
        </Link>
      </PageHeader>

      <State resource={mine} />
      <State resource={resource} />

      <div className="grid items-start gap-5 xl:grid-cols-2">
        {rows(resource.data).map((challenge) => (
          <article className="panel stack" key={id(challenge)}>
            <div className="between">
              <Badge>{challenge.status}</Badge>
              <span className="text-xs text-muted">
                {led.has(id(challenge.toTeam))
                  ? "Incoming challenge"
                  : "Sent challenge"}
              </span>
            </div>

            <h2 className="text-xl font-bold">
              <EntityName value={challenge.fromTeam} />
              <span className="mx-3 font-display italic text-primary">VS</span>
              <EntityName value={challenge.toTeam} />
            </h2>

            <div className="rounded-xl border border-border bg-background p-4 text-sm">
              <p>{dateTime(challenge.startsAt)}</p>
              <p className="mt-2 text-muted">{challenge.venue?.name}</p>
              <p className="mt-1 text-xs text-muted">
                {challenge.venue?.address}
              </p>
            </div>

            {challenge.status === "pending" && (
              <div className="row">
                {(led.has(id(challenge.toTeam))
                  ? ["accepted", "declined"]
                  : led.has(id(challenge.fromTeam))
                    ? ["cancelled"]
                    : []
                ).map((decision) => (
                  <Action
                    key={decision}
                    action={() =>
                      api.patch(`/challenges/${id(challenge)}`, {
                        decision,
                      })
                    }
                  >
                    {decision === "accepted"
                      ? "Accept challenge"
                      : decision === "declined"
                        ? "Decline"
                        : "Cancel challenge"}
                  </Action>
                ))}
              </div>
            )}

            {challenge.status === "accepted" && (
              <Link className="text-sm font-bold text-primary" to="/matches">
                Go to matches →
              </Link>
            )}
          </article>
        ))}
      </div>

      {!resource.loading && !resource.error && !rows(resource.data).length && (
        <Empty title="Bring on the competition">
          Team leaders can send a challenge from another team’s profile.
        </Empty>
      )}

      <Pager
        page={page}
        setPage={setPage}
        count={rows(resource.data).length}
        loading={resource.loading}
      />
    </div>
  );
}
