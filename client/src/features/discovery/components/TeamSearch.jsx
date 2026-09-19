import { Search, X } from "lucide-react";

export default function TeamSearch({ value, onChange, id = "team-search" }) {
  return (
    <div className="flex h-11 items-center gap-3 rounded-xl border border-[#456276] bg-linear-to-r from-[#142131] to-[#172c3d] px-3.5 focus-within:border-primary motion-safe:transition-colors">
      <label htmlFor={id} className="sr-only">Search by name</label>
      <button type="submit" form="discovery-search" aria-label="Submit search"
        className="shrink-0 text-muted hover:text-primary">
        <Search size={20} strokeWidth={1.7} aria-hidden="true" />
      </button>
      <input id={id} type="search" form="discovery-search" maxLength={80}
        value={value} onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name"
        className="min-w-0 flex-1 bg-transparent py-2 text-sm text-content outline-none placeholder:text-muted focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none" />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background/50 hover:text-primary">
          <X size={17} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}