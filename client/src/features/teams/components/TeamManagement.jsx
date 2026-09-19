import { useState } from "react";
import { Link } from "react-router";
import { api, query } from "../../../lib/api";
import { id, rows, dateTime } from "../../../utils/data";
import { useResource } from "../../../hooks/useResource";
import { State, Badge, Pager } from "../../../components/ui/Feedback";
import { Action } from "../../../components/ui/Form";
import EntityName from "../../../components/common/EntityName";

export default function TeamManagement({ team }) {
  const [page, setPage] = useState(1);
  const [invitePage, setInvitePage] = useState(1);

  const requests = useResource(
    query("/join-requests", { teamId: id(team), page, limit: 20 }),
    { interval: 30000 },
  );

  const invitations = useResource(
    query("/invitations", {
      teamId: id(team),
      page: invitePage,
      limit: 20,
    }),
    { interval: 30000 },
  );

  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <section className="panel stack">
        <h2 className="section-title">Join requests</h2>
        <State resource={requests} />

        {rows(requests.data).map((request) => (
          <article
            className="stack border-t border-border pt-4"
            key={id(request)}
          >
            <div className="between">
              <Link to={`/players/${id(request.user)}`} className="font-bold">
                <EntityName kind="user" value={request.user} />
              </Link>
              <Badge>{request.status}</Badge>
            </div>

            <p className="text-sm text-muted">
              {request.message || "I’d like to join your team."}
            </p>

            {request.status === "pending" && (
              <div className="row">
                {["accepted", "rejected"].map((decision) => (
                  <Action
                    key={decision}
                    action={() => api.patch(
                      `/join-requests/${id(request)}`,
                      { decision },
                    )}
                  >
                    {decision === "accepted" ? "Accept player" : "Decline"}
                  </Action>
                ))}
              </div>
            )}
          </article>
        ))}

        {!requests.loading && !requests.error && !rows(requests.data).length && (
          <p className="text-sm text-muted">No join requests yet.</p>
        )}

        <Pager
          page={page}
          setPage={setPage}
          count={rows(requests.data).length}
          loading={requests.loading}
        />
      </section>

      <section className="panel stack">
        <div className="between">
          <h2 className="section-title">Invited players</h2>
          <Link to="/discover" className="text-sm text-primary">
            Find players →
          </Link>
        </div>

        <State resource={invitations} />

        {rows(invitations.data).map((invite) => {
          const expired = new Date(invite.expiresAt) <= new Date();

          return (
            <article className="list-item" key={id(invite)}>
              <div>
                <Link className="font-bold" to={`/players/${id(invite.user)}`}>
                  <EntityName kind="user" value={invite.user} />
                </Link>

                <p className="my-2 text-xs text-muted">
                  Expires {dateTime(invite.expiresAt)}
                </p>

                <Badge>
                  {invite.status === "pending" && expired
                    ? "expired"
                    : invite.status}
                </Badge>
              </div>

              {invite.status === "pending" && !expired && (
                <Action
                  action={() => api.patch(`/invitations/${id(invite)}`, {
                    decision: "cancelled",
                  })}
                >
                  Cancel invitation
                </Action>
              )}
            </article>
          );
        })}

        {!invitations.loading &&
          !invitations.error &&
          !rows(invitations.data).length && (
          <p className="text-sm text-muted">
            Open a player profile to invite them to your team.
          </p>
        )}

        <Pager
          page={invitePage}
          setPage={setInvitePage}
          count={rows(invitations.data).length}
          loading={invitations.loading}
        />
      </section>
    </div>
  );
}