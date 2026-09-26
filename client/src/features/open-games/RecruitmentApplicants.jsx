import { api, query } from "../../lib/api";
import { id, rows } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { Action } from "../../components/ui/Form";

export default function RecruitmentApplicants({ requestId }) {
  const resource = useResource(query(`/open-games/urgent/${requestId}/applications`, { page: 1, limit: 50 }));
  return <div className="stack border-t border-border pt-3">
    <h3 className="font-bold">Applications</h3>
    {rows(resource.data).map((application) => <div className="between gap-3" key={id(application)}>
      <span className="text-sm">{application.user?.name} <span className="text-muted">· {application.status}</span></span>
      {application.status === "pending" && <div className="flex gap-2">
        <Action action={() => api.patch(`/open-games/urgent/applications/${id(application)}`, { decision: "accepted" })}>Accept</Action>
        <Action danger action={() => api.patch(`/open-games/urgent/applications/${id(application)}`, { decision: "rejected" })}>Reject</Action>
      </div>}
    </div>)}
    {!resource.loading && !rows(resource.data).length && <p className="text-sm text-muted">No applications yet.</p>}
  </div>;
}
