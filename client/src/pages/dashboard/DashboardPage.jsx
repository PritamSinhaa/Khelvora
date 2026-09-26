import { Link } from "react-router";
import { ArrowRight, CalendarDays, Compass, MapPin, Plus, Volleyball } from "lucide-react";
import { api, query } from "../../lib/api";
import { useResource } from "../../hooks/useResource";
import { useAuth } from "../../features/auth/useAuth";
import { dateTime, id, rows } from "../../utils/data";
import { Badge, Empty, PageHeader, State } from "../../components/ui/Feedback";
import { Action } from "../../components/ui/Form";

function Widget({ title, eyebrow, href, children }) {
  return <section className="panel min-w-0 stack">
    <div className="between gap-3">
      <div><p className="eyebrow">{eyebrow}</p><h2 className="section-title">{title}</h2></div>
      {href && <Link className="text-sm font-semibold text-primary hover:underline" to={href}>See all <ArrowRight className="inline" size={14} /></Link>}
    </div>
    {children}
  </section>;
}

function ProfileChecklist({ user, sports }) {
  const missing = [
    ...(!user.city ? [{ label: "Add your city", detail: "Find nearby teams and games." }] : []),
    ...(!user.location?.coordinates ? [{ label: "Set your location", detail: "See what is happening close to you." }] : []),
    ...(!rows(sports.data).length && !sports.loading && !sports.error ? [{ label: "Choose a sport", detail: "Get recommendations that fit your game." }] : []),
    ...(!user.bio?.trim() ? [{ label: "Write a short bio", detail: "Help teammates get to know you." }] : []),
  ];
  return <Widget title="Make your profile yours" eyebrow="Profile checklist">
    <State resource={sports} />
    {sports.error ? <p className="text-sm text-muted">Your profile fields are checked; sport preferences could not be loaded.</p> : missing.length ? <>
      <ul className="stack">{missing.map((item) => <li className="list-item" key={item.label}><div><p className="font-semibold">{item.label}</p><p className="text-xs text-muted">{item.detail}</p></div><span className="text-primary">•</span></li>)}</ul>
      <Link className="btn self-start" to="/profile">Update profile</Link>
    </> : <p className="text-sm text-muted">Your key profile details are in place. You can update them any time.</p>}
  </Widget>;
}

function UpcomingMatch() {
  const resource = useResource("/matches/upcoming", { interval: 60000 });
  const match = resource.data;
  return <Widget title="Your next match" eyebrow="Coming up" href="/matches">
    <State resource={resource} />
    {!resource.loading && !resource.error && !match && <Empty title="No match on the calendar yet"><Link className="font-semibold text-primary hover:underline" to="/challenges">Challenge a team</Link> to get a match scheduled.</Empty>}
    {match && <>
      <div><p className="font-display text-2xl font-bold">{match.homeTeam?.name || "Home team"} <span className="text-primary">vs</span> {match.awayTeam?.name || "Away team"}</p><p className="mt-2 text-sm text-muted">{dateTime(match.startsAt)}</p></div>
      <div className="rounded-xl border border-border bg-background p-4 text-sm"><p className="row"><MapPin size={15} className="text-primary" />{match.venue?.name || "Venue to be confirmed"}</p><p className="mt-1 text-xs text-muted">{match.venue?.address}</p><p className="mt-3">Attendance: <Badge>{match.attendanceStatus || "No response"}</Badge></p></div>
      <Link className="btn self-start" to={`/matches/${id(match)}`}>Match details</Link>
    </>}
  </Widget>;
}

function ActionItems() {
  const resource = useResource("/dashboard/actions", { interval: 60000 });
  const data = resource.data || {};
  const count = rows(data.invitations).length + rows(data.joinRequests).length + rows(data.challenges).length;
  return <Widget title="Needs your attention" eyebrow="Pending decisions">
    <State resource={resource} />
    {!resource.loading && !resource.error && !count && <Empty title="All caught up"><Link to="/teams" className="font-semibold text-primary hover:underline">Visit your teams</Link> or discover new ones.</Empty>}
    {rows(data.invitations).map((invite) => <article key={`invite-${id(invite)}`} className="list-item"><div><p className="font-semibold">Team invitation</p><p className="text-xs text-muted">{invite.team?.name || "A team"}</p></div><div className="row"><Action action={() => api.patch(`/invitations/${id(invite)}`, { decision: "accepted" })}>Accept</Action><Action danger action={() => api.patch(`/invitations/${id(invite)}`, { decision: "declined" })}>Decline</Action></div></article>)}
    {rows(data.joinRequests).map((request) => <article key={`request-${id(request)}`} className="list-item"><div><p className="font-semibold">Join request</p><p className="text-xs text-muted">{request.user?.name || "A player"} wants to join {request.team?.name || "your team"}</p></div><div className="row"><Action action={() => api.patch(`/join-requests/${id(request)}`, { decision: "accepted" })}>Accept</Action><Action danger action={() => api.patch(`/join-requests/${id(request)}`, { decision: "rejected" })}>Decline</Action></div></article>)}
    {rows(data.challenges).map((challenge) => <article key={`challenge-${id(challenge)}`} className="list-item"><div><p className="font-semibold">Match challenge</p><p className="text-xs text-muted">{challenge.fromTeam?.name || "A team"} challenged {challenge.toTeam?.name || "your team"} · {dateTime(challenge.startsAt)}</p></div><div className="row"><Action action={() => api.patch(`/challenges/${id(challenge)}`, { decision: "accepted" })}>Accept</Action><Action danger action={() => api.patch(`/challenges/${id(challenge)}`, { decision: "declined" })}>Decline</Action></div></article>)}
  </Widget>;
}

function UnreadConversations() {
  const resource = useResource("/dashboard/unread-conversations", { interval: 60000 });
  const items = rows(resource.data);
  return <Widget title="Unread conversations" eyebrow="Catch up" href="/messages">
    <State resource={resource} />
    {!resource.loading && !resource.error && !items.length && <Empty title="No unread conversations">New messages will show up here.</Empty>}
    {items.map((conversation) => <Link className="list-item hover:border-primary/50" key={conversation.conversationId} to={conversation.href}>
      <div className="min-w-0"><p className="font-semibold">{conversation.label}</p><p className="mt-1 truncate text-sm text-muted">{conversation.preview}</p></div><Badge>{conversation.unreadCount} unread</Badge>
    </Link>)}
  </Widget>;
}

function NearbyGames({ hasLocation }) {
  const resource = useResource(hasLocation ? "/open-games/nearby" : null, { interval: 60000 });
  const items = rows(resource.data);
  return <Widget title="Open games near you" eyebrow="Places available" href="/open-games">
    {!hasLocation && <Empty title="Add a location to find games"><Link className="font-semibold text-primary hover:underline" to="/profile">Set your location</Link> to see open games within 25 km.</Empty>}
    {hasLocation && <State resource={resource} />}
    {hasLocation && !resource.loading && !resource.error && !items.length && <Empty title="No nearby games with places available"><Link className="font-semibold text-primary hover:underline" to="/open-games">Browse all open games</Link> to find another fit.</Empty>}
    {items.map((game) => <article className="list-item" key={id(game)}><div className="min-w-0"><p className="font-semibold">{game.title}</p><p className="mt-1 text-xs text-muted">{dateTime(game.startsAt)} · {game.venue?.name}</p><p className="text-xs text-muted">{(game.distanceMeters / 1000).toFixed(1)} km away</p><p className="text-xs text-primary">{game.remainingPlaces} {game.remainingPlaces === 1 ? "place" : "places"} open</p></div><Action action={() => api.post(`/open-games/${id(game)}/join`)}>Join</Action></article>)}
  </Widget>;
}

function Recommendations({ hasSports, hasLocation }) {
  const path = hasSports ? query("/discovery/teams", { sort: "recommended", limit: 4, ...(hasLocation ? { radiusKm: 25 } : {}) }) : null;
  const resource = useResource(path);
  const items = rows(resource.data);
  return <Widget title="Teams picked for you" eyebrow="Recommended">
    {!hasSports && <Empty title="Choose a sport for recommendations"><Link className="font-semibold text-primary hover:underline" to="/profile">Add a sport to your profile</Link> to get team suggestions.</Empty>}
    {hasSports && <State resource={resource} />}
    {hasSports && !resource.loading && !resource.error && !items.length && <Empty title="No recommendations yet"><Link className="font-semibold text-primary hover:underline" to="/discover">Explore all teams</Link> to broaden your search.</Empty>}
    {items.map((team) => <Link className="list-item hover:border-primary/50" key={id(team)} to={`/teams/${id(team)}`}><div><p className="font-semibold">{team.name}</p><p className="text-xs text-muted">{team.city || "Location not set"}</p></div><div className="row flex-wrap justify-end">{(team.recommendationReasons || []).slice(0, 2).map((reason) => <Badge key={reason}>{reason}</Badge>)}</div></Link>)}
  </Widget>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const preferences = useResource("/player-sports");
  const hasSports = rows(preferences.data).length > 0;
  const hasLocation = Boolean(user.location?.coordinates);
  return <div className="stack">
    <PageHeader eyebrow="Your game plan" title={`Welcome back, ${user.name.split(/\s+/)[0]}`} description="Your matches, team decisions, and nearby games in one place.">
      <Link className="btn" to="/open-games"><Volleyball size={16} />Organize a game</Link>
    </PageHeader>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Link className="panel row hover:border-primary/50" to="/discover"><Compass className="text-primary" /><span><strong className="block">Discover teams</strong><span className="text-xs text-muted">Find a team that fits</span></span></Link>
      <Link className="panel row hover:border-primary/50" to="/teams/new"><Plus className="text-primary" /><span><strong className="block">Create a team</strong><span className="text-xs text-muted">Bring players together</span></span></Link>
      <Link className="panel row hover:border-primary/50" to="/challenges"><CalendarDays className="text-primary" /><span><strong className="block">Organize a match</strong><span className="text-xs text-muted">Challenge another team</span></span></Link>
    </div>
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <UpcomingMatch />
      <ActionItems />
      <UnreadConversations />
      <NearbyGames hasLocation={hasLocation} />
      <Recommendations hasSports={hasSports} hasLocation={hasLocation} />
      <ProfileChecklist user={user} sports={preferences} />
    </div>
  </div>;
}
