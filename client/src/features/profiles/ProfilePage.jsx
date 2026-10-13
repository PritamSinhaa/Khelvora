import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { CalendarDays, Clock3, MapPin, Trophy, X, Zap } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { query } from "../../lib/api";
import { id, initials, rows } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { PageHeader } from "../../components/ui/Feedback";
import PlayerMatchHistory from "../../pages/players/PlayerMatchHistory";

export default function ProfilePage() {
  const { user } = useAuth();
  const [photoOpen, setPhotoOpen] = useState(false);
  const photoDialog = useRef(null);
  const preferences = useResource("/player-sports");
  const history = useResource(query("/users/me/match-history", { page: 1, limit: 1 }));
  const challenges = useResource(query("/challenges", { page: 1, limit: 1 }));
  const playerSports = rows(preferences.data);
  const primarySport = playerSports[0];
  const otherSports = playerSports.slice(1);
  const hasAvailability = playerSports.some((preference) => preference.availability?.length);
  const summary = history.data?.summary;

  useEffect(() => {
    const dialog = photoDialog.current;
    if (!dialog) return;
    if (photoOpen && !dialog.open) {
      dialog.showModal();
      dialog.querySelector("button")?.focus();
    }
    if (!photoOpen && dialog.open) dialog.close();
  }, [photoOpen]);

  const stats = [
    { label: "Matches", value: summary?.matches, Icon: CalendarDays },
    { label: "Wins", value: summary?.wins, Icon: Trophy },
    { label: "Win Rate", value: summary ? `${summary.winRate}%` : null, Icon: Clock3 },
    { label: "Challenges", value: challenges.data?.total, Icon: Zap },
  ];

  return (
    <div className="mx-auto max-w-6xl stack">
      <PageHeader title="Your profile" eyebrow="Meet the player" />

      <section className="relative isolate overflow-hidden rounded-2xl border border-border bg-linear-to-br from-surface via-surface to-background p-4 shadow-xl shadow-black/20 sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 -z-10 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 top-28 -z-10 hidden h-80 w-16 rotate-45 bg-primary/5 sm:block" />
        <div aria-hidden="true" className="pointer-events-none absolute right-16 top-40 -z-10 hidden h-64 w-5 rotate-45 bg-primary/10 sm:block" />

        <div className="flex flex-col gap-5 border-b border-border pb-5 sm:flex-row sm:items-center sm:gap-7">
          {user.avatarUrl ? (
            <button type="button" aria-label="View full profile photo" onClick={() => setPhotoOpen(true)} className="avatar mx-auto size-32 cursor-zoom-in overflow-hidden rounded-full border-4 border-primary bg-background p-1 text-3xl sm:mx-0 sm:size-44">
              <img src={user.avatarUrl} alt={`${user.name} profile`} className="size-full rounded-full object-cover" />
            </button>
          ) : (
            <div className="avatar mx-auto size-32 rounded-full border-4 border-primary bg-background p-1 text-3xl sm:mx-0 sm:size-44">
              {initials(user.name)}
            </div>
          )}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="eyebrow mb-2">Player card</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{user.name}</h2>
            {user.bio && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{user.bio}</p>}
            {primarySport ? (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span className="inline-flex items-center gap-2 text-base font-semibold sm:text-lg">
                  <Trophy size={20} className="text-primary" aria-hidden="true" />
                  {primarySport.sport?.name || primarySport.sportName || "Sport"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
                  <Trophy size={15} aria-hidden="true" />{primarySport.skillLevel}
                </span>
              </div>
            ) : <p className="mt-5 text-sm text-muted">Add your sports from the edit profile page.</p>}
            {otherSports.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="mr-1 text-sm text-muted">Also plays:</span>
                {otherSports.map((preference) => <span className="rounded-full bg-surface-hover px-4 py-2 text-sm" key={id(preference)}>{preference.sport?.name || preference.sportName || "Sport"}</span>)}
              </div>
            )}
          </div>
        </div>

        <div className="between gap-4 border-b border-border py-4">
          <p className="flex items-center gap-3 text-sm sm:text-base">
            <MapPin size={20} className="shrink-0 text-primary" aria-hidden="true" />
            {[user.city, user.state, user.country].filter(Boolean).join(", ") || "Add your location"}
          </p>
          {hasAvailability && <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"><span className="size-3 rounded-full bg-primary" />Weekly availability set</span>}
        </div>

        <div className="my-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-background/50 sm:grid-cols-4">
          {stats.map(({ label, value, Icon }, index) => (
            <div className={`flex min-h-24 flex-col items-center justify-center gap-1 border-border p-3 text-center ${index % 2 ? "border-l" : ""} ${index > 1 ? "border-t" : ""} sm:border-l sm:border-t-0 ${index === 0 ? "sm:border-l-0" : ""}`} key={label}>
              <Icon size={20} className="mb-1 text-primary" aria-hidden="true" />
              <strong className="text-xl font-bold">{value ?? "—"}</strong>
              <span className="text-xs text-muted sm:text-sm">{label}</span>
            </div>
          ))}
        </div>

        <Link to="/profile/edit" className="btn mt-2 min-h-12 px-6 text-sm">Edit profile</Link>
      </section>

      {user.avatarUrl && (
        <dialog
          ref={photoDialog}
          aria-label={`${user.name} profile photo`}
          className="m-0 h-dvh w-screen max-h-none max-w-none place-items-center bg-transparent p-5 backdrop:bg-black/85 open:grid"
          onCancel={(event) => {
            event.preventDefault();
            setPhotoOpen(false);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPhotoOpen(false);
          }}
        >
          <div className="relative grid max-h-full max-w-full place-items-center">
            <button type="button" className="btn secondary absolute -right-3 -top-3 z-10 size-10 min-h-10 rounded-full p-0" aria-label="Close profile photo" onClick={() => setPhotoOpen(false)}>
              <X size={20} aria-hidden="true" />
            </button>
            <img src={user.avatarUrl} alt={`${user.name} profile photo`} className="max-h-[85dvh] max-w-[90vw] rounded-xl object-contain shadow-2xl" />
          </div>
        </dialog>
      )}

      <PlayerMatchHistory />
    </div>
  );
}
