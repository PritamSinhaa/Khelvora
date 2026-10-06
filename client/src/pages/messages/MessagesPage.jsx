import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { query } from "../../lib/api";
import { id, rows } from "../../utils/data";
import { useResource } from "../../hooks/useResource";
import { useLive } from "../../features/messaging/useLive";
import { State, Empty, PageHeader, Pager } from "../../components/ui/Feedback";
import ConversationTitle from "../../features/messaging/components/ConversationTitle";
import ConversationView from "../../features/messaging/components/ConversationView";
import useConversationTarget from "../../features/messaging/useConversationTarget";

export default function MessagesPage() {
  const { conversationId } = useParams();
  const [params] = useSearchParams();
  const [page, setPage] = useState(1);
  const connected = useLive();

  const conversations = useResource(
    query("/conversations", { page, limit: 20 }),
    { interval: 30000 },
  );

  const target = useConversationTarget(params.get("team"), params.get("match"));

  return (
    <div className="stack lg:h-[calc(100dvh-192px)] lg:min-h-0 lg:overflow-hidden">
      <PageHeader
        title="The team talk"
        eyebrow="Messages"
        description="Get the game plan together."
      >
        <span className="row text-xs text-muted">
          <span
            className={`size-2 rounded-full ${
              connected ? "bg-primary" : "bg-muted"
            }`}
          />
          {connected ? "Connected" : "Updates every 15 seconds"}
        </span>
      </PageHeader>

      <State resource={target} />

      <div className="grid items-start gap-5 lg:min-h-0 lg:flex-1 lg:grid-rows-1 lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="panel min-w-0 stack lg:h-full lg:min-h-0 lg:gap-3 lg:overflow-hidden">
          <div className="between">
            <h2 className="section-title">Chats</h2>
            <Link to="/discover" className="text-xs font-bold text-primary">
              Find players →
            </Link>
          </div>

          <State resource={conversations} />

          <div className="flex gap-3 overflow-x-auto lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:overscroll-contain">
            {rows(conversations.data).map((conversation) => (
              <Link
                key={id(conversation)}
                to={`/messages/${id(conversation)}`}
                className={`min-w-44 rounded-xl border p-3 transition-colors lg:min-w-0 ${
                  id(conversation) === conversationId
                    ? "border-primary/50 bg-primary/10"
                    : "border-border hover:bg-surface-hover"
                }`}
              >
                <p className="text-sm font-bold">
                  <ConversationTitle conversation={conversation} />
                </p>
                <p className="mt-1 text-xs capitalize text-muted">
                  {conversation.kind.replaceAll("-", " ")}
                </p>
              </Link>
            ))}
          </div>

          {!conversations.loading &&
            !conversations.error &&
            !rows(conversations.data).length && (
              <p className="text-sm text-muted">
                Start a chat from a player or team profile.
              </p>
            )}

          <Pager
            page={page}
            setPage={setPage}
            count={rows(conversations.data).length}
            loading={conversations.loading}
          />
        </aside>

        {conversationId ? (
          <ConversationView
            key={conversationId}
            conversationId={conversationId}
          />
        ) : (
          <Empty title="Your crew is a message away">
            Choose a conversation to get started.
          </Empty>
        )}
      </div>
    </div>
  );
}
