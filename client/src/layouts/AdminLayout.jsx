import { Link, NavLink, Outlet } from "react-router";

export default function AdminLayout() {
  return (
    <div className="stack">
      <nav
        className="between rounded-xl border border-border bg-surface p-3"
        aria-label="Administration"
      >
        <NavLink
          to="/admin/reports"
          className={({ isActive }) =>
            `btn ${isActive ? "" : "secondary"}`
          }
        >
          Community reports
        </NavLink>

        <Link
          to="/discover"
          className="text-sm text-muted hover:text-primary"
        >
          Back to Khelvora →
        </Link>
      </nav>

      <Outlet />
    </div>
  );
}