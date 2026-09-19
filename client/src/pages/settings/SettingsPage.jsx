import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { api, query } from "../../lib/api";
import { id, rows } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { useAuth } from "../../features/auth/useAuth";
import { State, PageHeader, Pager } from "../../components/ui/Feedback";
import { Form, Field, Action } from "../../components/ui/Form";
import EntityName from "../../components/common/EntityName";

export default function SettingsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const blocks = useResource(query("/blocks", { page, limit: 20 }));

  return (
    <div className="mx-auto max-w-3xl stack">
      <PageHeader
        title="Make it yours"
        eyebrow="Settings"
        description="Your account, your privacy, your game."
      />

      <section className="panel stack">
        <h2 className="section-title">Account</h2>

        <div className="between">
          <div>
            <p className="font-bold">{auth.user.name}</p>
            <p className="mt-1 text-sm text-muted">{auth.user.email}</p>
          </div>
          <Link to="/profile" className="btn secondary">
            Edit profile
          </Link>
        </div>

        <div className="row">
          <Link className="text-sm text-primary" to="/notifications">
            Notifications →
          </Link>
          <Link className="text-sm text-primary" to="/open-games">
            Open games →
          </Link>
          <Link className="text-sm text-primary" to="/reports">
            {auth.user.role === "admin" ? "Manage reports" : "Your reports"} →
          </Link>
        </div>
      </section>

      <section className="panel stack">
        <h2 className="section-title">Change password</h2>

        <Form
          submit="Update password"
          action={(values) => {
            if (values.newPassword !== values.confirmPassword) {
              throw new Error("The new passwords do not match.");
            }

            if (new TextEncoder().encode(values.newPassword).length > 72) {
              throw new Error("Use a password of at most 72 UTF-8 bytes.");
            }

            return api.patch("/auth/password", {
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            });
          }}
          onDone={() => {
            auth.clearSession();
            navigate("/login", { replace: true });
          }}
        >
          <Field
            label="Current password"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />

          <Field
            label="New password"
            name="newPassword"
            type="password"
            minLength={10}
            required
            autoComplete="new-password"
            hint="At least 10 characters."
          />

          <Field
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            minLength={10}
            required
            autoComplete="new-password"
          />

          <p className="text-xs text-muted">
            You’ll sign in again after updating your password.
          </p>
        </Form>
      </section>

      <section className="panel stack">
        <h2 className="section-title">Blocked players</h2>
        <State resource={blocks} />

        {rows(blocks.data).map((block) => (
          <div className="list-item" key={id(block)}>
            <EntityName kind="user" value={block.target} />
            <Action action={() => api.delete(`/blocks/${id(block.target)}`)}>
              Unblock player
            </Action>
          </div>
        ))}

        {!blocks.loading && !blocks.error && !rows(blocks.data).length && (
          <p className="text-sm text-muted">You haven’t blocked any players.</p>
        )}

        <Pager
          page={page}
          setPage={setPage}
          count={rows(blocks.data).length}
          loading={blocks.loading}
        />
      </section>

      <section className="panel stack">
        <h2 className="section-title">Time for a break?</h2>
        <p className="text-sm text-muted">
          Signing out ends your active sessions on all devices.
        </p>
        <Action danger confirm="Sign out on all devices?" action={auth.logout}>
          Sign out
        </Action>
      </section>
    </div>
  );
}
