import { Link, useNavigate, useParams } from "react-router";
import {
  MapPin,
  UsersRound,
  Trophy,
  ArrowLeft,
} from "lucide-react";

import { useAuth } from "../../features/auth/useAuth";
import { useResource } from "../../hooks/useResource";
import { api } from "../../lib/api";
import { id, rows, teamView } from "../../utils/data";

import { State, Badge } from "../../components/ui/Feedback";
import { Action, Form, Field } from "../../components/ui/Form";

import TeamCover from "../../features/teams/components/TeamCover";
import TeamManagement from "../../features/teams/components/TeamManagement";
import TeamMembers from "../../features/teams/components/TeamMembers";
import ChallengeForm from "../../features/challenges/components/ChallengeForm";
import TeamMatchHistory from "./components/TeamMatchHistory";

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

  const isLeader = Boolean(
    team && id(team.leader) === id(user),
  );

  const isMember =
    isLeader ||
    rows(mine.data).some((item) => id(item) === teamId);

  const ledTeams = rows(mine.data).filter(
    (item) => id(item.leader) === id(user),
  );

  if (!team) {
    return <State resource={resource} />;
  }

  const recruiting =
    team.lookingForPlayers &&
    team.memberCount < team.maxMembers;

  return (
    <div className="stack">
      <Link
        to="/discover"
        className="row text-sm text-muted hover:text-primary"
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Back to discovery
      </Link>

      <State resource={resource} />

      <section className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-br from-surface-hover to-surface">
        <TeamCover
          key={teamId}
          src={team.coverUrl}
          name={team.name}
          className="h-48 border-b border-border sm:h-72"
        />

        <div className="relative stack p-6 sm:p-10">
          <div className="between flex-wrap gap-3">
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

          <h1 className="page-title break-words sm:text-6xl">
            {team.name}
          </h1>

          <div className="row flex-wrap text-sm text-muted">
            <span className="row">
              <MapPin size={16} aria-hidden="true" />
              {team.city}
            </span>

            <span className="row">
              <UsersRound size={16} aria-hidden="true" />
              {team.memberCount} / {team.maxMembers} players
            </span>
          </div>

          <p className="max-w-2xl whitespace-pre-wrap break-words text-sm leading-relaxed text-muted">
            {team.bio || "A team with a shared love for the game."}
          </p>

          <p className="text-sm font-bold text-primary">
            {isMember
              ? "You’re part of this crew"
              : recruiting
                ? "Open to new players"
                : "Not currently recruiting"}
          </p>

          <State resource={mine} />

          <div className="row flex-wrap">
            {!mine.loading && !mine.error && (
              <Action
                action={async () => {
                  if (isMember) {
                    navigate(`/messages?team=${teamId}`);
                    return;
                  }

                  const conversation = await api.post(
                    "/conversations",
                    {
                      kind: "team-inquiry",
                      teamId,
                    },
                  );

                  navigate(`/messages/${id(conversation)}`);
                }}
              >
                {isMember
                  ? "Open team chat"
                  : "Message team leader"}
              </Action>
            )}

            {isMember && !isLeader && (
              <Action
                danger
                confirm="Leave this team?"
                action={() =>
                  api.delete(
                    `/memberships/teams/${teamId}/me`,
                  )
                }
                onDone={() => navigate("/teams")}
              >
                Leave team
              </Action>
            )}
          </div>
        </div>
      </section>

      <section
        aria-label="Team match statistics"
        className="grid grid-cols-2 gap-3 sm:grid-cols-5"
      >
        {["completedMatches", "wins", "draws", "losses", "winPercentage"].map((key) => (
          <div className="panel" key={key}>
            <Trophy
              size={15}
              aria-hidden="true"
              className="mb-3 text-muted"
            />

            <p className="font-display text-4xl text-primary">
              {key === "winPercentage" ? `${stats.data?.[key] ?? 0}%` : stats.data?.[key] ?? "—"}
            </p>

            <p className="mt-1 text-xs capitalize text-muted">
              {key === "completedMatches" ? "completed matches" : key === "winPercentage" ? "win percentage" : key}
            </p>
          </div>
        ))}
      </section>

      <State resource={stats} />

      {stats.data?.recentForm?.length > 0 && <section className="panel stack">
        <div><h2 className="section-title">Recent form</h2><p className="text-xs text-muted">Last five completed matches with confirmed results, newest first.</p></div>
        <div className="row flex-wrap">{stats.data.recentForm.map((item, index) => <div className="stack items-center" key={`${item.startsAt}:${index}`}><Badge>{item.outcome}</Badge><span className="text-[10px] text-muted">{new Date(item.startsAt).toLocaleDateString()}</span></div>)}</div>
      </section>}

      <TeamMatchHistory teamId={teamId} />

      {!isMember &&
        !mine.loading &&
        !mine.error &&
        recruiting && (
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
        <TeamManagement
          key={`management:${teamId}`}
          team={team}
        />
      )}

      <ChallengeForm
        opponent={team}
        teams={ledTeams}
        userId={id(user)}
      />
    </div>
  );
}
