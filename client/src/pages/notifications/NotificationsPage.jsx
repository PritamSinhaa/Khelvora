import { Link } from "react-router";
import { Bell } from "lucide-react";

import { PageHeader } from "../../components/ui/Feedback";

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl stack">
      <PageHeader
        title="Your updates"
        eyebrow="Notifications"
        description="A place for your team, match, and invitation updates."
      />

      <section className="panel stack items-center py-12 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Bell size={28} aria-hidden="true" />
        </span>

        <div>
          <h2 className="section-title">
            Notifications are not connected yet
          </h2>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            You can still check invitations, challenges, and
            conversations from their individual pages.
          </p>
        </div>

        <div className="row justify-center">
          <Link to="/teams" className="btn">
            Team invitations
          </Link>

          <Link to="/challenges" className="btn secondary">
            Challenges
          </Link>

          <Link to="/messages" className="btn secondary">
            Messages
          </Link>
        </div>
      </section>
    </div>
  );
}