import { Component } from "react";
import { AlertCircle, LoaderCircle, SearchX } from "lucide-react";

export function Notice({ children, error = false }) {
  return children ? (
    <div role={error ? "alert" : "status"}
      className={`notice ${error ? "notice-error" : ""}`}>
      <AlertCircle size={17} className="shrink-0" />
      <span>{children}</span>
    </div>
  ) : null;
}

export function State({ resource }) {
  if (resource.error) {
    return (
      <div className="space-y-2">
        <Notice error>{resource.error}</Notice>
        <button className="btn secondary" onClick={resource.reload}>
          Try again
        </button>
      </div>
    );
  }

  return resource.loading && resource.data === null ? (
    <div role="status" className="flex items-center gap-3 py-6 text-sm text-muted">
      <LoaderCircle className="motion-safe:animate-spin" size={20} />
      Loading…
    </div>
  ) : null;
}

export function Empty({ title = "Nothing here yet", children }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/60 px-5 py-10 text-center">
      <SearchX size={26} className="mx-auto mb-3 text-primary/70" />
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}

export function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

export function PageHeader({ title, eyebrow, description, children }) {
  return (
    <div className="between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Pager({ page, setPage, count, limit = 20, loading = false }) {
  if (page === 1 && count < limit) return null;

  return (
    <nav className="between py-3" aria-label="Pagination">
      <button className="btn secondary" disabled={page === 1 || loading}
        onClick={() => setPage((value) => value - 1)}>
        Previous
      </button>
      <span className="text-xs text-muted">Page {page}</span>
      <button className="btn secondary" disabled={count < limit || loading}
        onClick={() => setPage((value) => value + 1)}>
        Next
      </button>
    </nav>
  );
}

export class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (
      <main className="panel mx-auto my-20 max-w-lg space-y-4">
        <h1 className="section-title">Something went wrong</h1>
        <p className="text-muted">Reload the page to try again.</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </main>
    ) : this.props.children;
  }
}