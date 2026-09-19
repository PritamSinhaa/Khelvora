import { Link } from "react-router";

export default function ComingSoonPage({ title }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 motion-safe:animate-enter sm:p-10">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        Coming soon
      </p>

      <h1 className="mt-3 text-3xl font-bold">{title}</h1>

      <p className="mt-3 text-muted">
        This section is part of our next development milestones.
      </p>

      <Link
        to="/discover"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-background hover:bg-primary-hover motion-safe:transition-colors"
      >
        Back to Discover
      </Link>
    </section>
  );
}