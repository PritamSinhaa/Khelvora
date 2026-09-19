import { Component } from "react";
import { Link } from "react-router";
import { Trophy } from "lucide-react";

import { useTask } from "../../hooks/useResource";

export function Logo() {
  return (
    <Link to="/" className="row text-2xl font-black">
      <Trophy className="text-brand" size={30} />
      Khelvora
    </Link>
  );
}

export function Notice({ children, error = false }) {
  if (!children) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      className={`notice ${error ? "error" : ""}`}
    >
      {children}
    </div>
  );
}

export function State({ resource }) {
  if (resource.error) {
    return (
      <div className="stack">
        <Notice error>{resource.error}</Notice>
        <button className="btn secondary" onClick={resource.reload}>
          Retry
        </button>
      </div>
    );
  }

  if (resource.loading && resource.data === null) {
    return <p role="status" className="muted py-4">Loading…</p>;
  }

  return null;
}

export function Field({ label, children, ...props }) {
  return (
    <label className="stack gap-2">
      <span className="text-sm font-semibold text-muted">
        {label}
      </span>

      {children || <input {...props} />}
    </label>
  );
}

export function Form({
  children,
  action,
  onDone,
  submit = "Save",
  reset = false,
  success = "",
}) {
  const task = useTask();

  function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));

    task.run(async () => {
      const result = await action(values, form);

      if (reset) form.reset();

      await onDone?.(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack">
      <fieldset disabled={task.busy} className="stack min-w-0">
        {children}

        <Notice error>{task.error}</Notice>
        <Notice>{success}</Notice>

        <button type="submit" className="btn justify-self-start">
          {task.busy ? "Please wait…" : submit}
        </button>
      </fieldset>
    </form>
  );
}

export function Action({
  children,
  action,
  onDone,
  confirm,
  danger = false,
  disabled = false,
}) {
  const task = useTask();

  return (
    <div className="stack gap-2">
      <button
        type="button"
        disabled={task.busy || disabled}
        className={`btn ${danger ? "danger" : "secondary"}`}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;

          task.run(async () => {
            const result = await action();
            await onDone?.(result);
          });
        }}
      >
        {task.busy ? "Please wait…" : children}
      </button>

      <Notice error>{task.error}</Notice>
    </div>
  );
}

export function Pager({ page, setPage, count, limit = 20 }) {
  return (
    <div className="row justify-end">
      <button
        className="btn secondary"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </button>

      <span className="muted">Page {page}</span>

      <button
        className="btn secondary"
        disabled={count < limit}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

export function Empty({ children = "Nothing here yet." }) {
  return <p className="muted py-5">{children}</p>;
}

export class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="panel m-6 stack">
          <h1 className="section-title">This screen could not load.</h1>
          <button className="btn" onClick={() => location.reload()}>
            Reload
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}