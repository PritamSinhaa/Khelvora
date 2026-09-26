import { useState } from "react";
import { Link } from "react-router";
import { Bell, Check, CheckCheck } from "lucide-react";

import { api, query } from "../../lib/api";
import { useResource } from "../../hooks/useResource";
import { PageHeader, State, Empty, Pager } from "../../components/ui/Feedback";

const notificationLink = (item) => {
  if (typeof item.link === "string" && item.link.startsWith("/") && !item.link.startsWith("//")) return item.link;
  if (item.type === "match" || item.type === "schedule") return `/matches/${item.entityId}`;
  if (item.type === "message") return `/messages/${item.entityId}`;
  if (item.type === "challenge") return "/challenges";
  return "/teams";
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const resource = useResource(query("/notifications", { page, limit: 20, unread: unreadOnly ? "true" : undefined }));
  const data = resource.data || {};
  const notifications = data.items || [];

  return (
    <div className="mx-auto max-w-3xl stack">
      <PageHeader title="Your updates" eyebrow="Notifications" description="Team, match, invitation, and message updates in one place.">
        {data.unreadCount > 0 && (
          <button className="btn secondary shrink-0" onClick={() => api.patch("/notifications/read-all")}>
            <CheckCheck size={16} aria-hidden="true" /> Mark all read
          </button>
        )}
      </PageHeader>

      <section className="panel stack">
        <div className="between gap-4 border-b border-border pb-4">
          <div className="row">
            <button className={`btn ${unreadOnly ? "secondary" : ""}`} onClick={() => { setUnreadOnly(false); setPage(1); }}>All</button>
            <button className={`btn ${unreadOnly ? "" : "secondary"}`} onClick={() => { setUnreadOnly(true); setPage(1); }}>Unread {data.unreadCount > 0 ? `(${data.unreadCount})` : ""}</button>
          </div>
          <span className="text-xs text-muted">{data.total || 0} update{data.total === 1 ? "" : "s"}</span>
        </div>

        <State resource={resource} />

        {!resource.loading && !resource.error && notifications.length === 0 && (
          <Empty title={unreadOnly ? "You’re all caught up" : "No updates yet"}>
            <Bell size={18} className="mx-auto mb-2 text-primary/70" />
            Team invitations, match plans, and new messages will show up here.
          </Empty>
        )}

        <div className="flex flex-col gap-3">
          {notifications.map((item) => (
            <article key={item._id} className={`between gap-4 rounded-xl border p-4 ${item.readAt ? "border-border bg-background" : "border-primary/30 bg-primary/5"}`}>
              <Link to={notificationLink(item)} className="min-w-0 flex-1 rounded-lg focus-visible:outline-primary" onClick={() => { if (!item.readAt) void api.patch(`/notifications/${item._id}/read`); }}>
                <div className="row items-start gap-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.readAt ? "bg-border" : "bg-primary"}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed">{item.text}</p>
                    <time className="mt-1 block text-xs text-muted" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
                  </div>
                </div>
              </Link>
              {!item.readAt && (
                <button className="btn secondary shrink-0 px-3" aria-label="Mark as read" title="Mark as read" onClick={() => api.patch(`/notifications/${item._id}/read`)}>
                  <Check size={16} aria-hidden="true" />
                </button>
              )}
            </article>
          ))}
        </div>

        {data.total > data.limit && (
          <Pager page={page} setPage={setPage} count={notifications.length} hasNext={page * data.limit < data.total} loading={resource.loading} />
        )}
      </section>
    </div>
  );
}
