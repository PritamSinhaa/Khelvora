import { useEffect, useRef, useState } from "react";
import { api, query } from "../../../lib/api";
import { id, rows, dateTime } from "../../../utils/data";
import { useResource } from "../../../hooks/useResource";
import { useAuth } from "../../auth/useAuth";
import { useLive } from "../useLive";
import { Form, Field } from "../../../components/ui/Form";
import { State, Empty, Pager } from "../../../components/ui/Feedback";
import EntityName from "../../../components/common/EntityName";
import ConversationTitle from "./ConversationTitle";

export default function ConversationView({ conversationId }) {
  const { user } = useAuth();
  const connected = useLive();
  const [page, setPage] = useState(1);

  const pending = useRef(null);
  const viewport = useRef(null);
  const follow = useRef(true);

  const detail = useResource(`/conversations/${conversationId}`, {
    interval: 30000,
  });

  const messages = useResource(
    query("/messages", { conversationId, page, limit: 50 }),
    { interval: connected ? 30000 : 15000 },
  );

  const ordered = [...rows(messages.data)].sort(
    (first, second) =>
      new Date(first.createdAt) - new Date(second.createdAt) ||
      id(first).localeCompare(id(second)),
  );

  const latestId = id(ordered.at(-1));

  useEffect(() => {
    if (page === 1 && follow.current && viewport.current) {
      viewport.current.scrollTop = viewport.current.scrollHeight;
    }
  }, [latestId, page]);

  return (
    <section className="panel min-w-0 stack">
      <State resource={detail} />

      {detail.data && (
        <div className="border-b border-border pb-4">
          <h2 className="section-title">
            <ConversationTitle conversation={detail.data} />
          </h2>
          <p className="mt-1 text-xs capitalize text-muted">
            {detail.data.kind.replaceAll("-", " ")}
          </p>
        </div>
      )}

      <State resource={messages} />

      <div
        ref={viewport}
        aria-label="Messages"
        className="flex h-[45dvh] min-h-64 flex-col gap-3 overflow-y-auto overscroll-contain pr-2"
        onScroll={(event) => {
          const element = event.currentTarget;
          follow.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            80;
        }}
      >
        {!messages.error &&
          ordered.map((message) => {
            const own = id(message.sender) === id(user);

            return (
              <article
                key={id(message)}
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
                  own
                    ? "self-end rounded-br-sm bg-primary text-background"
                    : "self-start rounded-bl-sm border border-border bg-surface-hover"
                }`}
              >
                {!own && (
                  <p className="mb-1 text-xs font-bold text-primary">
                    <EntityName kind="user" value={message.sender} />
                  </p>
                )}

                <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {message.text}
                </p>

                <time
                  dateTime={message.createdAt}
                  className="mt-2 block text-[10px] opacity-65"
                >
                  {dateTime(message.createdAt)}
                </time>
              </article>
            );
          })}

        {!messages.loading && !messages.error && !ordered.length && (
          <Empty title="Break the ice">Say hello to your crew.</Empty>
        )}
      </div>

      <Pager
        page={page}
        setPage={setPage}
        count={rows(messages.data).length}
        limit={50}
        loading={messages.loading}
      />

      {page > 1 && (
        <button
          className="text-sm font-bold text-primary"
          onClick={() => {
            follow.current = true;
            setPage(1);
          }}
        >
          Return to latest messages ↓
        </button>
      )}

      {detail.data && !detail.error && !messages.error && (
        <Form
          submit="Send message"
          reset
          action={(values) => {
            const text = values.text.trim();

            if (!text) throw new Error("Write a message first.");

            // Reuse the same client ID when retrying a failed message.
            if (pending.current?.text !== text) {
              pending.current = {
                text,
                clientId: crypto.randomUUID(),
              };
            }

            return api.post("/messages", {
              conversationId,
              ...pending.current,
            });
          }}
          onDone={() => {
            pending.current = null;
            follow.current = true;
            setPage(1);
            messages.reload();
          }}
        >
          <Field label="Your message">
            <textarea
              name="text"
              required
              maxLength={2000}
              placeholder="What’s the game plan?"
              className="min-h-20!"
            />
          </Field>
        </Form>
      )}
    </section>
  );
}
