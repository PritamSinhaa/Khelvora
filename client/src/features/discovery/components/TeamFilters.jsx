import { ChevronDown, MapPin, Signal, UsersRound } from "lucide-react";

export default function TeamFilters({
  players = false,
  maxDistance,
  skillLevel,
  recruitingOnly,
  onDistanceChange,
  onSkillChange,
  onRecruitingChange,
}) {
  const selectClass =
    "min-h-11 w-full appearance-none rounded-lg border border-border " +
    "bg-surface pr-9 pl-10 text-sm text-content hover:border-primary/50 " +
    "motion-safe:transition-colors";

  const leftIcon =
    "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted";

  const rightIcon =
    "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted";

  return (
    <div
      role="group"
      aria-label="Additional team filters"
      className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3"
    >
      <div className="relative min-w-0 sm:w-44">
        <MapPin size={17} aria-hidden="true" className={leftIcon} />

        <select
          aria-label="Maximum distance"
          value={maxDistance}
          onChange={(event) => onDistanceChange(event.target.value)}
          className={selectClass}
        >
          {[5, 10, 25, 50, 100].map((distance) => (
            <option key={distance} value={distance}>
              Within {distance} km
            </option>
          ))}
        </select>

        <ChevronDown size={15} aria-hidden="true" className={rightIcon} />
      </div>

      <div className="relative min-w-0 sm:w-48">
        <Signal size={17} aria-hidden="true" className={leftIcon} />

        <select
          aria-label="Team skill level"
          value={skillLevel}
          onChange={(event) => onSkillChange(event.target.value)}
          className={selectClass}
        >
          <option value="all">Any skill level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>

        <ChevronDown size={15} aria-hidden="true" className={rightIcon} />
      </div>

      {!players && (
        <label
          className={`col-span-2 inline-flex min-h-11 cursor-pointer items-center
            gap-2.5 rounded-lg border px-3 text-sm motion-safe:transition-colors ${
              recruitingOnly
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-surface text-content hover:border-primary/50"
            }`}
        >
          <input
            type="checkbox"
            checked={recruitingOnly}
            onChange={(event) => onRecruitingChange(event.target.checked)}
            className="size-4 shrink-0 accent-primary"
          />
          <UsersRound size={17} aria-hidden="true" />
          <span>Looking for players</span>
        </label>
      )}
    </div>
  );
}
