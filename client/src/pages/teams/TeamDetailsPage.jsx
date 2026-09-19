import { Link, useNavigate, useParams } from "react-router";
import { MapPin, UsersRound, Trophy, ArrowLeft } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { useResource } from "../../hooks/useResource";
import { api } from "../../lib/api";
import { id, rows, teamView } from "../../utils/data";
import { State, Badge } from "../../components/ui/Feedback";
import { Action, Form, Field } from "../../components/ui/Form";
import TeamManagement from "../../features/teams/components/TeamManagement";
import TeamMembers from "../../features/teams/components/TeamMembers";
import ChallengeForm from "../../features/challenges/components/ChallengeForm";

export default function TeamDetailsPage() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const resource = useResource(`/teams/${teamId}`);
  const mine = useResource("/teams/mine");
  const sports = useResource("/sports");
  const stats = useResource(`/teams/${teamId}/stats`);

  const team = resource.data
    ? teamView(resource.data, rows(sports.data))
    : null;

  const isLeader = !!team && id(team.leader) === id(user);
  const isMember =
    isLeader || rows(mine.data).some((item) => id(item) === teamId);

  const ledTeams = rows(mine.data).filter(
    (item) => id(item.leader) === id(user),
  );

  if (!team) return <State resource={resource} />;

  return (
    <div className="stack">
      <Link
        to="/discover"
        className="row text-sm text-muted hover:text-primary"
      >
        <ArrowLeft size={17} />
        Back to discovery
      </Link>

      <State resource={resource} />

      <section className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-br from-surface-hover to-surface p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-0 font-display text-[180px] leading-none italic text-primary/5"
        >
          {team.initials}
        </div>

        <div className="relative stack">
          <div className="between">
            <Badge>
              {team.sportLabel} · {team.skillLevel}
            </Badge>

            {isLeader && (
              <Link
                className="btn secondary"
                to={`/teams/${teamId}/edit`}
              >
                Edit team
              </Link>
            )}
          </div>

          <h1 className="page-title sm:text-6xl">{team.name}</h1>

          <div className="row text-sm text-muted">
            <span className="row">
              <MapPin size={16} />
              {team.city}
            </span>
            <span className="row">
              <UsersRound size={16} />
              {team.memberCount} / {team.maxMembers} players
            </span>
          </div>

          <p className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {team.bio || "A team with a shared love for the game."}
          </p>

          <p className="text-sm font-bold text-primary">
            {isMember
              ? "You’re part of this crew"
              : team.lookingForPlayers && team.memberCount < team.maxMembers
                ? "Open to new players"
                : "Not currently recruiting"}
          </p>

          <State resource={mine} />

          <div className="row">
            {!mine.loading && !mine.error && (
              <Action
                action={async () => {
                  if (isMember) {
                    navigate(`/messages?team=${teamId}`);
                    return;
                  }

                  const conversation = await api.post("/conversations", {
                    kind: "team-inquiry",
                    teamId,
                  });

                  navigate(`/messages/${id(conversation)}`);
                }}
              >
                {isMember ? "Open team chat" : "Message team leader"}
              </Action>
            )}

            {isMember && !isLeader && (
              <Action
                danger
                confirm="Leave this team?"
                action={() =>
                  api.delete(`/memberships/teams/${teamId}/me`)
                }
                onDone={() => navigate("/teams")}
              >
                Leave team
              </Action>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {["played", "wins", "draws", "losses"].map((key) => (
          <div className="panel" key={key}>
            <Trophy size={15} className="mb-3 text-muted" />
            <p className="font-display text-4xl text-primary">
              {stats.data?.[key] ?? "—"}
            </p>
            <p className="mt-1 text-xs capitalize text-muted">{key}</p>
          </div>
        ))}
      </section>

      <State resource={stats} />

      {!isMember &&
        !mine.loading &&
        !mine.error &&
        team.lookingForPlayers &&
        team.memberCount < team.maxMembers && (
          <section className="panel stack">
            <h2 className="section-title">Join the crew</h2>

            <Form
              submit="Request to join"
              action={(values) =>
                api.post("/join-requests", {
                  teamId,
                  message: values.message.trim(),
                })
              }
              onDone={() => navigate("/teams")}
            >
              <Field label="Message to the leader">
                <textarea
                  name="message"
                  maxLength={300}
                  placeholder="Tell the team about yourself and your playing experience."
                />
              </Field>
            </Form>
          </section>
        )}

      {isMember && (
        <TeamMembers
          key={`members:${teamId}`}
          team={team}
          isLeader={isLeader}
        />
      )}

      {isLeader && (
        <TeamManagement key={`management:${teamId}`} team={team} />
      )}

      <ChallengeForm
        opponent={team}
        teams={ledTeams}
        userId={id(user)}
      />
    </div>
  );
}