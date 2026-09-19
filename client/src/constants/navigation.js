import {
  Bell, CalendarDays, Compass, MessageCircle, Settings,
  Flag, Swords, UserRound, UsersRound,
} from "lucide-react";

export const navigationItems = [
  { label: "Discover", to: "/discover", icon: Compass, mobileLabel: "Discover" },
  { label: "My Teams", to: "/teams", icon: UsersRound, mobileLabel: "Teams" },
  { label: "Matches", to: "/matches", icon: CalendarDays, mobileLabel: "Matches" },
  { label: "Messages", to: "/messages", icon: MessageCircle, mobileLabel: "Chats" },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Open Games", to: "/open-games", icon: Flag },
  { label: "Challenges", to: "/challenges", icon: Swords },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "My Profile", to: "/profile", icon: UserRound, mobileLabel: "Profile" },
];