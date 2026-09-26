import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Plus } from "lucide-react";
import { api, query } from "../../lib/api";
import { id, rows, teamView, dateTime } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { State, Empty, PageHeader, Badge, Pager } from "../../components/ui/Feedback";
import { Action } from "../../components/ui/Form";
import TeamGrid from "../../features/teams/components/TeamGrid";
import EntityName from "../../components/common/EntityName";

export default function TeamsPage() {
  const [searchParams] = useSearchParams();
  const [invitePage, setInvitePage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);

  const teams = useResource("/teams/mine");
  const invitations = useResource(
    query("/invitations", { page: invitePage, limit: 20 }),
    { interval: 30000 },
  );
  const requests = useResource(
    query("/join-requests", { page: requestPage, limit: 20 }),
    { interval: 30000 },
  );

  useEffect(() => {
    const inviteId = searchParams.get("invitation");
    if (!inviteId || !invitations.data) return;
    document.getElementById(`invitation-${inviteId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchParams, invitations.data]);

  return (
    <div className="stack">
      <PageHeader
        title="Your crew"
        eyebrow="My teams"
        description="The people who make every game worth showing up for."
      >
        <Link to="/teams/new" className="btn">
          <Plus size={17} />Create team
        </Link>
      </PageHeader>

      <State resource={teams} />

      {teams.data && !teams.error && (
        rows(teams.data).length ? (
          <TeamGrid teams={rows(teams.data).map((team) => teamView(team))} />
        ) : (
          <Empty title="Find your crew">
            <p>Join a local team or bring your own players together.</p>
            <Link to="/discover" className="btn mt-5">Discover teams</Link>
          </Empty>
        )
      )}

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section className="panel stack">
          <h2 className="section-title">Team invitations</h2>
          <State resource={invitations} />

          {rows(invitations.data).map((invite) => {
            const expired = new Date(invite.expiresAt) <= new Date();

            return (
              <article id={`invitation-${id(invite)}`} className={`list-item ${searchParams.get("invitation") === id(invite) ? "border-primary/60 bg-primary/5" : ""}`} key={id(invite)}>
                <div>
                  <Link
                    className="font-bold hover:text-primary"
                    to={`/teams/${id(invite.team)}`}
                  >
                    <EntityName value={invite.team} />
                  </Link>

                  <p className="mt-1 text-xs text-muted">
                    Expires {dateTime(invite.expiresAt)}
                  </p>

                  <div className="mt-2">
                    <Badge>
                      {expired && invite.status === "pending"
                        ? "expired"
                        : invite.status}
                    </Badge>
                  </div>
                </div>

                {invite.status === "pending" && !expired && (
                  <div className="row">
                    {["accepted", "declined"].map((decision) => (
                      <Action
                        key={decision}
                        action={() => api.patch(
                          `/invitations/${id(invite)}`, { decision },
                        )}
                      >
                        {decision === "accepted" ? "Accept invitation" : "Decline"}
                      </Action>
                    ))}
                  </div>
                )}
              </article>
            );
          })}

          {!invitations.loading &&
            !invitations.error &&
            !rows(invitations.data).length && (
            <p className="text-sm text-muted">
              Invitations from team leaders will appear here.
            </p>
          )}

          <Pager
            page={invitePage}
            setPage={setInvitePage}
            count={rows(invitations.data).length}
            loading={invitations.loading}
          />
        </section>

        <section className="panel stack">
          <h2 className="section-title">Your join requests</h2>
          <State resource={requests} />

          {rows(requests.data).map((request) => (
            <article className="list-item" key={id(request)}>
              <div>
                <Link
                  className="font-bold hover:text-primary"
                  to={`/teams/${id(request.team)}`}
                >
                  <EntityName value={request.team} />
                </Link>

                <p className="mt-1 text-sm text-muted">{request.message}</p>
                <div className="mt-2"><Badge>{request.status}</Badge></div>
              </div>

              {request.status === "pending" && (
                <Action
                  action={() => api.patch(`/join-requests/${id(request)}`, {
                    decision: "cancelled",
                  })}
                >
                  Cancel request
                </Action>
              )}
            </article>
          ))}

          {!requests.loading && !requests.error && !rows(requests.data).length && (
            <p className="text-sm text-muted">
              Request to join a team from its profile.
            </p>
          )}

          <Pager
            page={requestPage}
            setPage={setRequestPage}
            count={rows(requests.data).length}
            loading={requests.loading}
          />
        </section>
      </div>
    </div>
  );
}
