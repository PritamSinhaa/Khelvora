import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { api, query } from "../../lib/api";
import { id, rows, dateTime, scheduleFrom } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { useAuth } from "../../features/auth/useAuth";
import {
  State,
  Empty,
  PageHeader,
  Pager,
  Badge,
} from "../../components/ui/Feedback";
import { Form, Field, Action } from "../../components/ui/Form";
import ScheduleFields from "../../components/common/ScheduleFields";

export default function OpenGamesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [sport, setSport] = useState("");

  const sports = useResource("/sports");
  const resource = useResource(
    query("/open-games", { page, limit: 20, sport }),
    { interval: 30000 },
  );

  return (
    <div className="stack">
      <PageHeader
        title="More play. Less planning."
        eyebrow="Open games"
        description="No team needed. Grab an open spot or host your own game."
      >
        <button
          className="btn"
          onClick={() => setCreating(!creating)}
        >
          <Plus size={17} />
          {creating ? "Close form" : "Host a game"}
        </button>
      </PageHeader>

      {creating && (
        <section className="panel">
          <Form
            submit="Create game"
            action={(values) =>
              api.post("/open-games", {
                title: values.title.trim(),
                sport: values.sport,
                capacity: Number(values.capacity),
                schedule: scheduleFrom(values),
              })
            }
            onDone={() => {
              setCreating(false);
              setPage(1);
            }}
          >
            <h2 className="section-title">Set up a game</h2>

            <Field
              label="Game title"
              name="title"
              required
              maxLength={100}
              placeholder="Saturday evening football"
            />

            <Field label="Sport">
              <select name="sport" required defaultValue="">
                <option value="" disabled>Choose a sport</option>
                {rows(sports.data).map((item) => (
                  <option value={id(item)} key={id(item)}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Total players (including you)"
              type="number"
              name="capacity"
              min={2}
              max={100}
              step={1}
              required
              defaultValue={6}
            />

            <ScheduleFields />
          </Form>
        </section>
      )}

      <State resource={sports} />

      <div className="max-w-xs">
        <Field label="Filter by sport">
          <select
            value={sport}
            onChange={(event) => {
              setSport(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All sports</option>
            {rows(sports.data).map((item) => (
              <option key={id(item)} value={id(item)}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <State resource={resource} />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {rows(resource.data).map((game) => {
          const host = id(game.host) === id(user);
          const joined = game.players.some(
            (player) => id(player) === id(user),
          );
          const full = game.players.length >= game.capacity;

          return (
            <article className="panel stack" key={id(game)}>
              <div className="between">
                <Badge>
                  {rows(sports.data).find(
                    (item) => id(item) === id(game.sport),
                  )?.name || "Open game"}
                </Badge>

                <span className="text-xs text-muted">
                  {game.players.length} / {game.capacity} players
                </span>
              </div>

              <h2 className="text-xl font-bold">{game.title}</h2>
              <p className="text-sm">{dateTime(game.startsAt)}</p>

              <div className="text-sm text-muted">
                <p className="flex items-center gap-2">
                  <MapPin size={15} />
                  {game.venue?.name}
                </p>
                <p className="mt-2 text-xs">{game.venue?.address}</p>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(
                      100,
                      (game.players.length / game.capacity) * 100,
                    )}%`,
                  }}
                />
              </div>

              <Action
                disabled={!host && !joined && full}
                danger={host}
                confirm={host ? "Cancel this open game?" : undefined}
                action={() =>
                  api.post(
                    `/open-games/${id(game)}/${
                      host ? "cancel" : joined ? "leave" : "join"
                    }`,
                  )
                }
              >
                {host
                  ? "Cancel game"
                  : joined
                    ? "Leave game"
                    : full
                      ? "Game full"
                      : "Join game"}
              </Action>
            </article>
          );
        })}
      </div>

      {!resource.loading &&
        !resource.error &&
        !rows(resource.data).length && (
          <Empty title="The field is open">
            Be the first to host a game.
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