import TeamCard from "./TeamCard";

export default function TeamGrid({ teams }) {
  if (teams.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <h3 className="text-lg font-semibold">No teams found</h3>

        <p className="mt-2 text-sm text-muted">
          Try another sport or choose All sports.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {teams.map((team, index) => (
        <div
          key={team.id}
          className="h-full motion-safe:animate-enter"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <TeamCard team={team} />
        </div>
      ))}
    </div>
  );
}