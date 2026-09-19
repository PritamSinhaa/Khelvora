import { useAuth } from "../../auth/useAuth";
import { id } from "../../../utils/data";
import EntityName from "../../../components/common/EntityName";

export default function ConversationTitle({ conversation }) {
  const { user } = useAuth();

  if (conversation.kind === "team" || conversation.kind === "team-inquiry") {
    return (
      <>
        <EntityName value={conversation.team} />
        {conversation.kind === "team-inquiry" ? " · Inquiry" : ""}
      </>
    );
  }

  if (conversation.kind === "match") {
    return <>Match chat · {id(conversation.match).slice(-4)}</>;
  }

  return (
    <EntityName
      kind="user"
      value={conversation.participants?.find(
        (participant) => id(participant) !== id(user),
      )}
    />
  );
}
