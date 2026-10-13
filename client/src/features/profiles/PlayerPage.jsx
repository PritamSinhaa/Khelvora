import { Link, useNavigate, useParams } from "react-router";
import { MapPin, MessageCircle, Trophy } from "lucide-react";
import { api } from "../../lib/api";
import { id, rows, initials } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { useAuth } from "../../features/auth/useAuth";
import { State } from "../../components/ui/Feedback";
import { Action, Form, Field } from "../../components/ui/Form";

export default function PlayerPage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const resource = useResource(`/users/${userId}`);
  const mine = useResource("/teams/mine");
  const player = resource.data;
  const location = [player?.city, player?.state, player?.country].filter(Boolean).join(", ");

  const teams = rows(mine.data).filter((team) => id(team.leader) === id(user));

  if (!player) return <State resource={resource} />;

  return (
    <div className="mx-auto max-w-3xl stack">
      <Link to="/discover" className="text-sm text-muted">
        ← Back to discovery
      </Link>

      <section className="relative isolate overflow-hidden rounded-2xl border border-border bg-linear-to-br from-surface via-surface to-background p-5 shadow-xl shadow-black/20 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 -z-10 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="avatar mx-auto size-32 rounded-full border-4 border-primary bg-background p-1 text-4xl sm:mx-0 sm:size-40">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={`${player.name} profile`}
              className="size-full rounded-full object-cover"
            />
          ) : (
            initials(player.name)
          )}
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="eyebrow mb-2">Player profile</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{player.name}</h1>
          {location && <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted sm:justify-start"><MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />{location}</p>}
        </div>
        </div>

        <div className="border-b border-border py-6">
          <h2 className="section-title mb-3">Sports & skill</h2>
          {player.sports?.length ? (
            <div className="flex flex-wrap gap-2">
              {player.sports.map((preference) => (
                <span key={id(preference.sport)} className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  <Trophy size={15} className="text-primary" aria-hidden="true" />
                  <span className="font-semibold">{preference.sport?.name || "Sport"}</span>
                  <span className="text-xs text-muted">{preference.skillLevel}</span>
                </span>
              ))}
            </div>
          ) : <p className="text-sm text-muted">No sports added yet.</p>}
        </div>

        <h2 className="section-title mt-6">About</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
          {player.bio || "This player hasn’t added a bio yet."}
        </p>

        {userId === id(user) ? (
          <Link className="btn mt-6 w-full sm:w-auto" to="/profile">
            Edit your profile
          </Link>
        ) : (
          <div className="grid gap-3 pt-6 sm:grid-cols-2">
            <Action
              className="w-full"
              action={() =>
                api.post("/conversations", { kind: "direct", userId })
              }
              onDone={(conversation) =>
                navigate(`/messages/${id(conversation)}`)
              }
            >
              <MessageCircle size={17} aria-hidden="true" />
              Message player
            </Action>

            <Action
              className="w-full"
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
