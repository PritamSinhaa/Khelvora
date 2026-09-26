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
import { skillLevels } from "../../utils/data";
import RecruitmentApplicants from "../../features/open-games/RecruitmentApplicants";

export default function OpenGamesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [sport, setSport] = useState("");
  const [recruitmentSkill, setRecruitmentSkill] = useState("");
  const [urgentCreating, setUrgentCreating] = useState(false);
  const [urgentPage, setUrgentPage] = useState(1);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const sports = useResource("/sports");
  const resource = useResource(
    query("/open-games", { page, limit: 20, sport }),
    { interval: 30000 },
  );
  const urgent = useResource(query("/open-games/urgent", {
    page: urgentPage, limit: 20, sport, skill: recruitmentSkill, timeZone,
  }), { interval: 30000 });

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

      <section className="stack">
        <div className="between gap-4">
          <div>
            <p className="eyebrow">Urgent recruitment</p>
            <h2 className="section-title">Need players today</h2>
          </div>
          <button className="btn" onClick={() => setUrgentCreating(!urgentCreating)}>
            <Plus size={17} />{urgentCreating ? "Close form" : "Post a player request"}
          </button>
        </div>
        {urgentCreating && <section className="panel">
          <Form submit="Publish request" action={(values) => api.post("/open-games/urgent", {
            sport: values.sport, slots: Number(values.slots),
            skillPreference: values.skillPreference,
            startsAt: new Date(values.startsAt).toISOString(),
            venue: { name: values.venueName.trim(), address: values.venueAddress.trim(), location: { type: "Point", coordinates: [Number(values.longitude), Number(values.latitude)] } },
          })} onDone={() => { setUrgentCreating(false); setUrgentPage(1); }}>
            <h3 className="section-title">Find players for your game</h3>
            <Field label="Sport"><select name="sport" required defaultValue=""><option value="" disabled>Choose a sport</option>{rows(sports.data).map((item) => <option value={id(item)} key={id(item)}>{item.name}</option>)}</select></Field>
            <Field label="Game starts at" type="datetime-local" name="startsAt" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Player places needed" type="number" name="slots" min={1} max={100} required defaultValue={2} />
              <Field label="Skill preference"><select name="skillPreference" defaultValue="Any"><option>Any</option>{skillLevels.map((skill) => <option key={skill}>{skill}</option>)}</select></Field>
            </div>
            <Field label="Venue name" name="venueName" required maxLength={120} />
            <Field label="Venue address" name="venueAddress" required maxLength={250} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Longitude" name="longitude" type="number" min={-180} max={180} step="any" required />
              <Field label="Latitude" name="latitude" type="number" min={-90} max={90} step="any" required />
            </div>
          </Form>
        </section>}
        <div className="grid items-start gap-5 lg:grid-cols-2">
          {rows(urgent.data).map((request) => {
            const organizer = id(request.organizer) === id(user);
            const confirmed = request.confirmedPlayers?.some((player) => id(player) === id(user));
            return <UrgentCard key={id(request)} request={request} organizer={organizer} confirmed={confirmed} />;
          })}
        </div>
        {!urgent.loading && !urgent.error && !rows(urgent.data).length && <Empty title="No urgent requests today">Try another sport or skill filter, or post a request.</Empty>}
      </section>

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

      <div className="max-w-xs">
        <Field label="Filter requests by skill">
          <select value={recruitmentSkill} onChange={(event) => { setRecruitmentSkill(event.target.value); setUrgentPage(1); }}>
            <option value="">All skill levels</option><option value="Any">Any skill</option>{skillLevels.map((skill) => <option key={skill}>{skill}</option>)}
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
          const reserved = game.reservationCount || 0;
          const committed = game.players.length + reserved;
          const full = (game.remainingPlaces ?? game.capacity - committed) <= 0;
          const waitlist = game.myWaitlistEntry;

          return (
            <article className="panel stack" key={id(game)}>
              <div className="between">
                <Badge>
                  {rows(sports.data).find(
                    (item) => id(item) === id(game.sport),
                  )?.name || "Open game"}
                </Badge>

                <span className="text-xs text-muted">
                  {game.players.length} confirmed / {game.capacity} places
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
                      (committed / game.capacity) * 100,
                    )}%`,
                  }}
                />
              </div>

              {reserved > 0 && <p className="text-xs text-muted">{reserved} place{reserved === 1 ? "" : "s"} reserved for waitlist offer{reserved === 1 ? "" : "s"}.</p>}
              {host ? <Action danger confirm="Cancel this open game?" action={() => api.post(`/open-games/${id(game)}/cancel`)}>Cancel game</Action>
                : joined ? <Action confirm="Leave this game? The next waitlisted player may be offered your place." action={() => api.post(`/open-games/${id(game)}/leave`)}>Leave game</Action>
                  : waitlist?.status === "offered" ? <>
                    <p className="text-sm font-semibold">A place is reserved for you until {dateTime(waitlist.offerExpiresAt)}.</p>
                    <div className="row">
                      <Action action={() => api.post(`/open-games/${id(game)}/waitlist/accept`)}>Accept place</Action>
                      <Action danger action={() => api.post(`/open-games/${id(game)}/waitlist/decline`)}>Decline offer</Action>
                    </div>
                  </>
                  : waitlist?.status === "queued" ? <>
                    <p className="text-sm font-semibold">Waitlist position: #{game.queuePosition || "—"}</p>
                    <Action danger confirm="Leave this waitlist?" action={() => api.delete(`/open-games/${id(game)}/waitlist`)}>Leave waitlist</Action>
                  </>
                  : <Action action={() => api.post(`/open-games/${id(game)}/${full ? "waitlist" : "join"}`)}>{full ? "Join waitlist" : "Join game"}</Action>}
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

function UrgentCard({ request, organizer, confirmed }) {
  const remaining = request.remainingSlots ?? Math.max(0, request.slots - (request.confirmedPlayers?.length || 0));
  return <article className="panel stack">
    <div className="between"><Badge>{request.sport?.name || "Game"}</Badge><span className="text-xs text-muted">{remaining} places left</span></div>
    <h3 className="text-xl font-bold">Need {request.slots} player{request.slots === 1 ? "" : "s"}</h3>
    <p className="text-sm">{dateTime(request.startsAt)} · Skill: {request.skillPreference === "Any" ? "Any level" : request.skillPreference}</p>
    <div className="text-sm text-muted"><p className="flex items-center gap-2"><MapPin size={15} />{request.venue?.name}</p><p className="mt-2 text-xs">{request.venue?.address}</p><p className="mt-2">Organized by {request.organizer?.name}</p></div>
    <p className="text-xs text-muted">{request.confirmedPlayers?.length || 0} confirmed · {request.pendingApplications || 0} pending</p>
    {organizer ? <>
      <Action danger confirm="Close recruitment for this game?" action={() => api.post(`/open-games/urgent/${id(request)}/close`)}>Close recruitment</Action>
      <RecruitmentApplicants requestId={id(request)} />
    </> : confirmed ? <Badge>Place confirmed</Badge> : request.myApplicationStatus === "pending" ? <Action danger confirm="Withdraw your application?" action={() => api.post(`/open-games/urgent/applications/${request.myApplicationId}/cancel`)}>Application pending · Withdraw</Action> : request.myApplicationStatus ? <Badge>Application {request.myApplicationStatus}</Badge> : <Action disabled={remaining === 0} action={() => api.post(`/open-games/urgent/${id(request)}/apply`)}>{remaining ? "Request to join" : "No places left"}</Action>}
  </article>;
}
