import mongoose from "mongoose";
import Team from "../teams/team.model.js";
import Membership from "../memberships/membership.model.js";
import Invitation from "../invitations/invitation.model.js";
import JoinRequest from "../join-requests/joinRequest.model.js";
import Challenge from "../challenges/challenge.model.js";
import Notification from "../notifications/notification.model.js";
import Conversation from "../conversations/conversation.model.js";
import Message from "../messages/message.model.js";
import Match from "../matches/match.model.js";
import User from "../users/user.model.js";

export async function actions(user) {
  const ledTeams = await Team.find({ leader: user._id }).distinct("_id");
  const now = new Date();
  const [invitations, joinRequests, challenges] = await Promise.all([
    Invitation.find({ user: user._id, status: "pending", expiresAt: { $gt: now } })
      .sort({ expiresAt: 1, _id: 1 }).limit(8).populate("team", "name").lean(),
    ledTeams.length ? JoinRequest.find({ team: { $in: ledTeams }, status: "pending" })
      .sort({ createdAt: 1, _id: 1 }).limit(8).populate("team", "name").populate("user", "name avatarUrl").lean() : [],
    ledTeams.length ? Challenge.find({ toTeam: { $in: ledTeams }, status: "pending", startsAt: { $gt: now } })
      .sort({ startsAt: 1, _id: 1 }).limit(8).populate("fromTeam", "name").populate("toTeam", "name").lean() : [],
  ]);
  return { invitations, joinRequests, challenges };
}

export async function unreadConversations(user) {
  const grouped = await Notification.aggregate([
    { $match: { user: user._id, type: "message", targetType: "conversation", readAt: null } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $group: { _id: "$entityId", unreadCount: { $sum: 1 }, latestUnreadAt: { $first: "$createdAt" } } },
    { $sort: { latestUnreadAt: -1, _id: 1 } },
    { $limit: 8 },
  ]);
  const conversationIds = grouped.map((entry) => entry._id)
    .filter((value) => mongoose.isValidObjectId(value))
    .map((value) => new mongoose.Types.ObjectId(value));
  if (!conversationIds.length) return [];

  const [teamIds, ledTeamIds] = await Promise.all([
    Membership.find({ user: user._id }).distinct("team"),
    Team.find({ leader: user._id }).distinct("_id"),
  ]);
  const matchIds = teamIds.length ? await Match.find({ $or: [{ homeTeam: { $in: teamIds } }, { awayTeam: { $in: teamIds } }] }).distinct("_id") : [];
  const conversations = await Conversation.find({
    _id: { $in: conversationIds },
    $or: [
      { kind: "direct", participants: user._id },
      { kind: "team", team: { $in: teamIds } },
      { kind: "match", match: { $in: matchIds } },
      { kind: "team-inquiry", requester: user._id },
      { kind: "team-inquiry", team: { $in: ledTeamIds } },
    ],
  }).lean();
  if (!conversations.length) return [];

  const ids = conversations.map((conversation) => conversation._id);
  const latestMessages = await Message.aggregate([
    { $match: { conversation: { $in: ids } } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $group: { _id: "$conversation", text: { $first: "$text" }, createdAt: { $first: "$createdAt" } } },
  ]);
  const teamRefIds = conversations.flatMap((conversation) => [conversation.team].filter(Boolean));
  const matchRefIds = conversations.filter((conversation) => conversation.kind === "match").map((conversation) => conversation.match);
  const [teams, matches] = await Promise.all([
    Team.find({ _id: { $in: [...teamRefIds, ...teamIds] } }).select("name").lean(),
    Match.find({ _id: { $in: matchRefIds } }).select("homeTeam awayTeam").lean(),
  ]);
  const namesByTeam = new Map(teams.map((team) => [String(team._id), team.name]));
  const matchById = new Map(matches.map((match) => [String(match._id), match]));
  const peerIds = conversations.filter((conversation) => conversation.kind === "direct")
    .flatMap((conversation) => conversation.participants.filter((participant) => String(participant) !== String(user._id)));
  const peers = await User.find({ _id: { $in: peerIds } }).select("name").lean();
  const peerNames = new Map(peers.map((peer) => [String(peer._id), peer.name]));
  const messageByConversation = new Map(latestMessages.map((message) => [String(message._id), message]));
  const unreadByConversation = new Map(grouped.map((entry) => [String(entry._id), entry]));

  return conversations.flatMap((conversation) => {
    const conversationId = String(conversation._id);
    const message = messageByConversation.get(conversationId);
    const unread = unreadByConversation.get(conversationId);
    if (!message || !unread) return [];
    let label = "Conversation";
    if (conversation.kind === "direct") {
      const peer = conversation.participants.find((participant) => String(participant) !== String(user._id));
      label = peerNames.get(String(peer)) || "Player";
    } else if (conversation.kind === "match") {
      const match = matchById.get(String(conversation.match));
      label = match ? `${namesByTeam.get(String(match.homeTeam)) || "Team"} vs ${namesByTeam.get(String(match.awayTeam)) || "Team"}` : "Match conversation";
    } else {
      label = namesByTeam.get(String(conversation.team)) || "Team conversation";
    }
    return [{ conversationId, label, kind: conversation.kind, preview: message.text, createdAt: message.createdAt, unreadCount: unread.unreadCount, href: `/messages/${conversationId}` }];
  }).sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));
}
