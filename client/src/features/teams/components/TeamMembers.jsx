import { useState } from "react";
import { Link } from "react-router";
import { api, query } from "../../../lib/api";
import { id, rows } from "../../../utils/data";
import { useResource } from "../../../hooks/useResource";
import { State, Badge, Pager } from "../../../components/ui/Feedback";
import { Action } from "../../../components/ui/Form";
import EntityName from "../../../components/common/EntityName";

export default function TeamMembers({ team, isLeader }) {
  const [page, setPage] = useState(1);
  const members = useResource(
    query(`/memberships/teams/${id(team)}`, { page, limit: 20 }),
  );

  return (
    <section className="panel stack">
      <h2 className="section-title">
        The lineup <span className="text-muted">({team.memberCount})</span>
      </h2>

      <State resource={members} />

      {rows(members.data).map((membership) => (
        <div className="list-item" key={id(membership)}>
          <Link
            className="font-semibold hover:text-primary"
            to={`/players/${id(membership.user)}`}
          >
            <EntityName kind="user" value={membership.user} />
          </Link>

          {id(membership.user) === id(team.leader) ? (
            <Badge>Leader</Badge>
          ) : (
            isLeader && (
              <div className="row">
                <Action
                  confirm="Transfer leadership to this player? You will become a regular member."
                  action={() =>
                    api.patch(`/teams/${id(team)}/leader`, {
                      userId: id(membership.user),
                    })
                  }
                >
                  Make leader
                </Action>

                <Action
                  danger
                  confirm="Remove this player from the team?"
                  action={() => api.delete(`/memberships/${id(membership)}`)}
                >
                  Remove
                </Action>
              </div>
            )
          )}
        </div>
      ))}

      <Pager
        page={page}
        setPage={setPage}
        count={rows(members.data).length}
        loading={members.loading}
      />
    </section>
  );
}
