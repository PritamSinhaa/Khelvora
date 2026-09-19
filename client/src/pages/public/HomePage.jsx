import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router";
import { RotateCcw, Plus, MapPin } from "lucide-react";

import DiscoveryHero from "../../features/discovery/components/DiscoveryHero";
import TeamSearch from "../../features/discovery/components/TeamSearch";
import SportFilter from "../../features/discovery/components/SportFilter";
import TeamFilters from "../../features/discovery/components/TeamFilters";
import DiscoverySidebar from "../../features/discovery/components/DiscoverySidebar";
import TeamGrid from "../../features/teams/components/TeamGrid";

import { useAuth } from "../../features/auth/useAuth";
import { useResource } from "../../hooks/useResource";
import { query } from "../../lib/api";
import { id, rows, teamView, initials } from "../../utils/data";

import {
  State,
  Empty,
  Notice,
  Pager,
} from "../../components/ui/Feedback";

export default function HomePage() {
  const { search, setSearch } = useOutletContext();
  const { user } = useAuth();

  const [mode, setMode] = useState(
    user.location ? "nearby" : "all",
  );
  const [kind, setKind] = useState("teams");
  const [selectedSport, setSelectedSport] = useState("all");
  const [maxDistance, setMaxDistance] = useState("10");
  const [skillLevel, setSkillLevel] = useState("all");
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [appliedSearch, setAppliedSearch] = useState("");

  // Both search inputs use the shared search value from AppLayout.
  useEffect(() => {
    if (!search.trim() && appliedSearch) {
      setAppliedSearch("");
      setPage(1);
    }
  }, [search, appliedSearch]);

  const sports = useResource("/sports");
  const nearby = mode === "nearby" || kind === "players";

  const filters = {
    page,
    limit: 20,
    sport: selectedSport === "all" ? undefined : selectedSport,
    q: appliedSearch || undefined,
  };

  if (nearby) {
    Object.assign(filters, {
      radiusKm: maxDistance,
      skillLevel: skillLevel === "all" ? undefined : skillLevel,
      recruiting:
        kind === "teams" && recruitingOnly ? "true" : undefined,
    });
  }

  const resource = useResource(
    query(nearby ? `/discovery/${kind}` : "/teams", filters),
  );

  const items = rows(resource.data);
  const sportItems = rows(sports.data);

  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  function reset() {
    setSelectedSport("all");
    setMaxDistance("10");
    setSkillLevel("all");
    setRecruitingOnly(false);
    setSearch("");
    setAppliedSearch("");
    setPage(1);
  }

  function submitSearch(event) {
    event.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <DiscoveryHero city={user.city} />

      <form
        id="discovery-search"
        className="row"
        onSubmit={submitSearch}
      >
        <div className="min-w-0 basis-full lg:hidden">
          <TeamSearch
            id="mobile-team-search"
            value={search}
            onChange={setSearch}
          />
        </div>

        <button
          className="btn secondary lg:hidden"
          type="submit"
        >
          Search {kind}
        </button>

        {appliedSearch && (
          <span className="text-sm text-muted">
            Results for “{appliedSearch}”
          </span>
        )}

        <Link className="btn ml-auto" to="/teams/new">
          <Plus size={16} aria-hidden="true" />
          Create a team
        </Link>
      </form>

      <section
        aria-label="Discover filters"
        className="space-y-4"
      >
        <div className="between">
          <div className="row">
            <button
              type="button"
              className={`btn ${kind === "teams" ? "" : "secondary"}`}
              onClick={() => change(setKind)("teams")}
            >
              Teams
            </button>

            <button
              type="button"
              className={`btn ${kind === "players" ? "" : "secondary"}`}
              onClick={() => change(setKind)("players")}
            >
              Players nearby
            </button>
          </div>

          {kind === "teams" && (
            <label className="field">
              <span className="sr-only">Discovery area</span>

              <select
                value={mode}
                onChange={(event) =>
                  change(setMode)(event.target.value)
                }
              >
                <option value="nearby">Near my location</option>
                <option value="all">All locations</option>
              </select>
            </label>
          )}
        </div>

        <State resource={sports} />

        <SportFilter
          sports={sportItems}
          allLabel={nearby ? "My sports" : "All sports"}
          selectedSport={selectedSport}
          onSportChange={change(setSelectedSport)}
        />

        {nearby && (
          <TeamFilters
            maxDistance={maxDistance}
            skillLevel={skillLevel}
            recruitingOnly={recruitingOnly}
            onDistanceChange={change(setMaxDistance)}
            onSkillChange={change(setSkillLevel)}
            onRecruitingChange={change(setRecruitingOnly)}
            players={kind === "players"}
          />
        )}

        {nearby && (
          <p className="text-xs text-muted">
            “My sports” uses the sports on your profile.
            Distances use your saved location.
          </p>
        )}

        {!user.location && (
          <Notice>
            <Link to="/profile" className="underline">
              Set your location and sports
            </Link>{" "}
            to discover nearby players and teams.
          </Notice>
        )}
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 stack">
          <div className="between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">
                {kind === "players"
                  ? "Find your next teammate"
                  : nearby
                    ? "Teams near you"
                    : "Explore teams"}
              </h2>

              <p className="mt-1 text-xs text-muted">
                {nearby
                  ? "Nearest first"
                  : "Recently created teams"}
              </p>
            </div>

            <button
              type="button"
              className="btn secondary"
              onClick={reset}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
          </div>

          <State resource={resource} />

          {!resource.error &&
            resource.data &&
            (kind === "teams" ? (
              <TeamGrid
                teams={items.map((team) =>
                  teamView(team, sportItems),
                )}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((player) => {
                  const distance =
                    Number.isFinite(player.distanceKm)
                      ? player.distanceKm
                      : Number.isFinite(player.distanceMeters)
                        ? Math.round(player.distanceMeters / 100) / 10
                        : null;

                  return (
                    <Link
                      key={id(player)}
                      to={`/players/${id(player)}`}
                      className="panel stack hover:border-primary/50"
                    >
                      <div className="row">
                        <span className="avatar">
                          {player.avatarUrl ? (
                            <img
                              src={player.avatarUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            initials(player.name)
                          )}
                        </span>

                        <div>
                          <h3 className="font-bold">
                            {player.name}
                          </h3>

                          <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                            <MapPin size={12} aria-hidden="true" />
                            {player.city || "Nearby player"}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-muted line-clamp-2">
                        {player.bio || "Ready for the next game."}
                      </p>

                      <p className="text-xs text-primary">
                        {distance !== null
                          ? `${distance} km away · `
                          : ""}
                        View profile →
                      </p>
                    </Link>
                  );
                })}

                {!items.length && (
                  <Empty title="No nearby players">
                    Try a wider radius or another sport.
                  </Empty>
                )}
              </div>
            ))}

          <Pager
            page={page}
            setPage={setPage}
            count={items.length}
            loading={resource.loading}
          />
        </section>

        <DiscoverySidebar />
      </div>
    </div>
  );
}