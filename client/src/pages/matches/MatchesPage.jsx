import { useState } from "react";
import { Link } from "react-router";

import { query } from "../../lib/api";
import { id, rows } from "../../utils/data";
import { useResource } from "../../hooks/useResource";

import {
  State,
  Empty,
  PageHeader,
  Pager,
} from "../../components/ui/Feedback";

import MatchCard from "./components/MatchCard";

export default function MatchesPage() {
  const [page, setPage] = useState(1);

  const matches = useResource(
    query("/matches", { page, limit: 20 }),
    { interval: 30000 },
  );

  const items = rows(matches.data);

  return (
    <div className="stack">
      <PageHeader
        title="Game on"
        eyebrow="Your matches"
        description="The schedule, the score, and everyone showing up."
      >
        <Link className="btn" to="/challenges">
          Team challenges →
        </Link>
      </PageHeader>

      <State resource={matches} />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {items.map((match) => (
          <MatchCard key={id(match)} match={match} />
        ))}
      </div>

      {!matches.loading && !matches.error && !items.length && (
        <Empty title="Your next match starts with a challenge">
          <p>
            When two leaders agree on a challenge, the match appears
            here.
          </p>

          <Link className="btn mt-5" to="/discover">
            Find a rival team
          </Link>
        </Empty>
      )}

      <Pager
        page={page}
        setPage={setPage}
        count={items.length}
        loading={matches.loading}
      />
    </div>
  );
}