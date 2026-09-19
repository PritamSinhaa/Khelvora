import { Link } from "react-router";
import { MessageCircle } from "lucide-react";
import { useResource } from "../../../hooks/useResource";
import { id, rows } from "../../../utils/data";
import { State } from "../../../components/ui/Feedback";
import ConversationTitle from "./ConversationTitle";

export default function TeamChatPreview() {
  const resource = useResource("/conversations?page=1&limit=3", {
    interval: 30000,
  });

  return (
    <section className="panel stack">
      <div className="between">
        <h2 className="section-title">Your conversations</h2>
        <MessageCircle size={18} className="text-primary" />
      </div>

      <State resource={resource} />

      {rows(resource.data).map((conversation) => (
        <Link
          key={id(conversation)}
          to={`/messages/${id(conversation)}`}
          className="rounded-xl border border-border bg-background p-3 text-sm hover:border-primary/50"
        >
          <ConversationTitle conversation={conversation} />
          <p className="mt-1 text-xs capitalize text-muted">
            {conversation.kind.replaceAll("-", " ")}
          </p>
        </Link>
      ))}

      {!resource.loading &&
        !resource.error &&
        !rows(resource.data).length && (
          <p className="text-sm text-muted">
            Start a conversation from a player or team profile.
          </p>
        )}

      <Link to="/messages" className="text-sm font-bold text-primary">
        Go to messages →
      </Link>
    </section>
  );
}