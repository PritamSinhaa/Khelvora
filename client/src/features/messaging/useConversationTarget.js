import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api, query } from "../../lib/api";
import { id, rows } from "../../utils/data";

export default function useConversationTarget(team, match) {
  const navigate = useNavigate();
  const [state, setState] = useState({
    loading: false,
    error: "",
  });
  const [retry, setRetry] = useState(0);

  const key = `${team}:${match}:${retry}`;

  useEffect(() => {
    if (!team && !match) return;

    const controller = new AbortController();

    (async () => {
      for (let page = 1; ; page++) {
        const results = rows(
          await api.get(
            query("/conversations", { page, limit: 50 }),
            { signal: controller.signal },
          ),
        );

        const found = results.find((conversation) =>
          team
            ? conversation.kind === "team" &&
              id(conversation.team) === team
            : conversation.kind === "match" &&
              id(conversation.match) === match,
        );

        if (found) {
          if (!controller.signal.aborted) {
            navigate(`/messages/${id(found)}`, { replace: true });
          }
          return;
        }

        if (results.length < 50) {
          throw new Error(
            "This chat isn’t available. Check that you’re still a member of the team.",
          );
        }
      }
    })().catch((error) => {
      if (!controller.signal.aborted) {
        setState({
          key,
          loading: false,
          error: error.message,
        });
      }
    });

    return () => controller.abort();
  }, [team, match, navigate, key]);

  return {
    ...(team || match
      ? state.key === key
        ? state
        : { loading: true, error: "" }
      : { loading: false, error: "" }),
    data: null,
    reload: () => setRetry((value) => value + 1),
  };
}