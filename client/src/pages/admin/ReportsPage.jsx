import { useState } from "react";
import { api, query } from "../../lib/api";
import { id, rows, dateTime } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { useAuth } from "../../features/auth/useAuth";
import {
  State,
  Empty,
  PageHeader,
  Pager,
  Badge,
} from "../../components/ui/Feedback";
import { Form, Field } from "../../components/ui/Form";
import EntityName from "../../components/common/EntityName";

export default function ReportsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const resource = useResource(query("/reports", { page, limit: 20 }));

  return (
    <div className="mx-auto max-w-4xl stack">
      <PageHeader
        title={user.role === "admin" ? "Manage reports" : "Your reports"}
        eyebrow="Community"
        description="Help keep the game welcoming for everyone."
      />

      <State resource={resource} />

      {rows(resource.data).map((report) => (
        <article className="panel stack" key={id(report)}>
          <div className="between">
            <Badge>{report.status}</Badge>
            <p className="text-xs text-muted">{dateTime(report.createdAt)}</p>
          </div>

          {user.role === "admin" && (
            <p className="text-sm text-muted">
              Reported player:{" "}
              <EntityName kind="user" value={report.targetUser} />
            </p>
          )}

          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {report.reason}
          </p>

          {report.resolution && (
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="eyebrow mb-2">Resolution</p>
              <p className="whitespace-pre-wrap text-sm text-muted">
                {report.resolution}
              </p>
            </div>
          )}

          {user.role === "admin" && report.status === "open" && (
            <Form
              submit="Save decision"
              action={(values) =>
                api.patch(`/reports/${id(report)}`, {
                  status: values.status,
                  resolution: values.resolution.trim(),
                })
              }
            >
              <Field label="Decision">
                <select name="status">
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </Field>

              <Field label="Resolution">
                <textarea name="resolution" required maxLength={2000} />
              </Field>
            </Form>
          )}
        </article>
      ))}

      {!resource.loading && !resource.error && !rows(resource.data).length && (
        <Empty title="No reports">
          Submitted reports and their updates appear here.
        </Empty>
      )}

      <Pager
        page={page}
        setPage={setPage}
        count={rows(resource.data).length}
        loading={resource.loading}
      />
    </div>
  );
}
