import UpcomingMatchCard from "../../../pages/matches/components/UpcomingMatchCard";
import TeamChatPreview from "../../messaging/components/TeamChatPreview";

export default function DiscoverySidebar() {
  return (
    <aside
      aria-label="Match and team updates"
      className="grid min-w-0 content-start gap-5 sm:grid-cols-2 xl:grid-cols-1"
    >
      <UpcomingMatchCard />
      <TeamChatPreview />
    </aside>
  );
}