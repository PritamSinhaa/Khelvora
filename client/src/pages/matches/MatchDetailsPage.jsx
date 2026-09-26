import { Link, useParams } from "react-router";

import { api } from "../../lib/api";
import { id, rows, dateTime } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { useAuth } from "../../features/auth/useAuth";

import { State, Badge } from "../../components/ui/Feedback";
import { Action } from "../../components/ui/Form";
import EntityName from "../../components/common/EntityName";

import ScheduleControls from "./components/ScheduleControls";
import ResultPanel from "./components/ResultPanel";
import AvailabilityPolls from "./components/AvailabilityPolls";
import MatchReminders from "./components/MatchReminders";

const attendanceOptions = [
  ["yes", "I’m playing"],
  ["no", "Can’t make it"],
  ["maybe", "Maybe"],
];

export default function MatchDetailsPage() {
  const { matchId } = useParams();
  const { user } = useAuth();

  const resource = useResource(`/matches/${matchId}`, {
    interval: 30000,
  });

  const match = resource.data;

  const teams = useResource("/teams/mine");

  const attendance = useResource(
    match ? `/attendance/matches/${matchId}` : null,
    { interval: 30000 },
  );

  const leaderTeam =
    match &&
    rows(teams.data).find(
      (team) =>
        id(team.leader) === id(user) &&
        [id(match.homeTeam), id(match.awayTeam)].includes(id(team)),
    );

  const attendanceItems = rows(attendance.data);

  const ownResponse = attendanceItems.find(
    (item) => id(item.user) === id(user),
  )?.response;

  if (!match) {
    return <State resource={resource} />;
  }

  const canRespond =
    match.status === "scheduled" &&
    new Date(match.startsAt) > new Date();

  return (
    <div className="stack">
      <Link to="/matches" className="text-sm text-muted">
        ← All matches
      </Link>

      <section className="panel stack">
        <div className="between">
          <p className="eyebrow">Match day</p>
          <Badge>{match.status}</Badge>
        </div>

        <h1 className="page-title">
          <EntityName value={match.homeTeam} />
          <span className="mx-3 text-primary italic">vs</span>
          <EntityName value={match.awayTeam} />
        </h1>

        <p className="text-sm">
          {dateTime(match.startsAt)} — {dateTime(match.endsAt)}
        </p>

        <div>
          <p className="font-semibold">{match.venue?.name}</p>
          <p className="mt-1 text-sm text-muted">
            {match.venue?.address}
          </p>
        </div>

        <Link
          className="btn self-start"
          to={`/messages?match=${matchId}`}
        >
          Open match chat
        </Link>
      </section>

      <State resource={resource} />

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section className="panel stack">
          <div>
            <h2 className="section-title">Who’s playing?</h2>
            <p className="mt-1 text-sm text-muted">
              Let both teams know if you can make it.
            </p>
          </div>

          {canRespond && (
            <div className="row">
              {attendanceOptions.map(([response, label]) => (
                <Action
                  key={response}
                  disabled={ownResponse === response}
                  action={() =>
                    api.put("/attendance", { matchId, response })
                  }
                >
                  {ownResponse === response ? "✓ " : ""}
                  {label}
                </Action>
              ))}
            </div>
          )}

          <State resource={attendance} />

          {attendanceItems.map((item) => (
            <div className="list-item" key={id(item)}>
              <EntityName kind="user" value={item.user} />

              <Badge>
                {item.response === "yes"
                  ? "Playing"
                  : item.response === "no"
                    ? "Unavailable"
                    : "Maybe"}
              </Badge>
            </div>
          ))}

          {!attendance.loading &&
            !attendance.error &&
            !attendanceItems.length && (
              <p className="text-sm text-muted">
                No attendance responses yet.
              </p>
            )}
        </section>

        <ResultPanel
          key={matchId}
          match={match}
          leaderTeam={id(leaderTeam)}
        />
      </div>

      <State resource={teams} />

      <AvailabilityPolls match={match} canManage={Boolean(leaderTeam)} />
      <MatchReminders key={`${matchId}:${match.reminderRevision}`} match={match} canManage={Boolean(leaderTeam)} />

      <ScheduleControls
        key={matchId}
        match={match}
        leaderTeam={id(leaderTeam)}
      />
    </div>
  );
}
