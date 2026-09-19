import { Link, useNavigate, useParams } from "react-router";
import { api } from "../../lib/api";
import { id, rows, initials } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { useAuth } from "../../features/auth/useAuth";
import { State, PageHeader } from "../../components/ui/Feedback";
import { Action, Form, Field } from "../../components/ui/Form";

export default function PlayerPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const resource = useResource(`/users/${userId}`);
  const mine = useResource("/teams/mine");
  const player = resource.data;

  const teams = rows(mine.data).filter((team) => id(team.leader) === id(user));

  if (!player) return <State resource={resource} />;

  return (
    <div className="mx-auto max-w-3xl stack">
      <Link to="/discover" className="text-sm text-muted">
        ← Back to discovery
      </Link>

      <section className="panel stack">
        <div className="avatar size-20 rounded-full text-3xl">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            initials(player.name)
          )}
        </div>

        <PageHeader
          title={player.name}
          eyebrow="Player profile"
          description={player.city || "Ready to play"}
        />

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
          {player.bio || "This player hasn’t added a bio yet."}
        </p>

        {userId === id(user) ? (
          <Link className="btn self-start" to="/profile">
            Edit your profile
          </Link>
        ) : (
          <div className="row">
            <Action
              action={() =>
                api.post("/conversations", { kind: "direct", userId })
              }
              onDone={(conversation) =>
                navigate(`/messages/${id(conversation)}`)
              }
            >
              Message player
            </Action>

            <Action
              danger
              confirm="Block direct interactions with this player?"
              action={() => api.post("/blocks", { userId })}
              onDone={() => navigate("/settings")}
            >
              Block player
            </Action>
          </div>
        )}
      </section>

      {userId !== id(user) && (
        <>
          <State resource={mine} />

          {teams.length > 0 && (
            <section className="panel stack">
              <h2 className="section-title">Invite to your team</h2>

              <Form
                submit="Send invitation"
                success="Invitation sent."
                action={(values) =>
                  api.post("/invitations", {
                    teamId: values.teamId,
                    userId,
                  })
                }
              >
                <Field label="Team">
                  <select name="teamId">
                    {teams.map((team) => (
                      <option key={id(team)} value={id(team)}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </Form>
            </section>
          )}

          <details className="panel">
            <summary className="cursor-pointer text-sm font-semibold">
              Report a concern
            </summary>

            <Form
              className="mt-5"
              submit="Submit report"
              action={(values) =>
                api.post("/reports", {
                  userId,
                  reason: values.reason.trim(),
                })
              }
              onDone={() => navigate("/reports")}
            >
              <Field label="What happened?">
                <textarea name="reason" required maxLength={2000} />
              </Field>
            </Form>
          </details>
        </>
      )}
    </div>
  );
}
