import { id } from "../../../utils/data";

const symbols = {
  football: "⚽", cricket: "🏏", badminton: "🏸",
  basketball: "🏀", tennis: "🎾", volleyball: "🏐",
};

export default function SportFilter({
  sports = [], selectedSport, onSportChange, allLabel = "All sports",
}) {
  const options = [
    { value: "all", label: allLabel },
    ...sports.map((sport) => ({
      value: id(sport), label: sport.name, icon: symbols[sport.slug],
    })),
  ];

  return (
    <div role="group" aria-label="Filter by sport"
      className="flex gap-2 overflow-x-auto p-1 [scrollbar-width:none] sm:gap-3">
      {options.map((sport) => (
        <button key={sport.value} type="button"
          aria-pressed={selectedSport === sport.value}
          onClick={() => onSportChange(sport.value)}
          className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors sm:px-5 ${
            selectedSport === sport.value
              ? "border-primary bg-primary text-background shadow-[0_0_18px_rgba(198,255,54,0.16)]"
              : "border-border bg-surface hover:border-primary/50"
          }`}>
          <span aria-hidden="true">{sport.icon}</span>
          {sport.label}
        </button>
      ))}
    </div>
  );
}