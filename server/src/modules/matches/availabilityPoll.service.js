import { AvailabilityPoll, PollResponse } from "./availabilityPoll.model.js";
import Match from "./match.model.js";
import Team from "../teams/team.model.js";
import Membership from "../memberships/membership.model.js";
import { tx, leader, same } from "../../services/access.service.js";
import { matchMember, matchLeader, lockMatch, ensureFree, future } from "../../services/matchAccess.service.js";
import { notify } from "../notifications/notification.service.js";
import { replaceReminders } from "./reminder.service.js";
import AppError from "../../utils/AppError.js";

export const create = (user, data) => tx(async () => {
  let teams;
  if (data.matchId) {
    const match = await lockMatch(data.matchId);
    if (match.status !== "scheduled" || match.startsAt <= new Date()) throw new AppError("Only future scheduled matches can have availability polls.", 409);
    await matchLeader(match, user._id);
    teams = [match.homeTeam, match.awayTeam];
  } else {
    const team = await leader(data.teamId, user._id);
    teams = [team._id];
  }
  if (new Date(data.closesAt) <= new Date() || data.options.some((option) => new Date(option.startsAt) <= new Date() || new Date(option.endsAt) <= new Date(option.startsAt))) throw new AppError("Poll options must be future times and the poll must close in the future.", 400);
  if (+new Date(data.closesAt) >= Math.min(...data.options.map((option) => +new Date(option.startsAt)))) throw new AppError("Poll must close before its earliest proposed time.", 400);
  if (data.matchId) for (const option of data.options) await ensureFree(teams, option.startsAt, option.endsAt, data.matchId);
  return AvailabilityPoll.create({ teamIds: teams, match: data.matchId || null, createdBy: user._id, closesAt: data.closesAt, options: data.options });
});

export async function listForMatch(user, matchId) {
  await matchMember(matchId, user._id);
  const polls = await AvailabilityPoll.find({ match: matchId }).sort({ createdAt: -1 }).lean();
  return attachTotals(polls, user._id);
}

export async function listForTeam(user, teamId) {
  if (!await Membership.exists({ user: user._id, team: teamId })) throw new AppError("Team membership required.", 403);
  const polls = await AvailabilityPoll.find({ teamIds: teamId, match: null }).sort({ createdAt: -1 }).lean();
  return attachTotals(polls, user._id);
}

async function attachTotals(polls, userId) {
  const ids = polls.map((poll) => poll._id);
  const responses = ids.length ? await PollResponse.find({ poll: { $in: ids } }).lean() : [];
  return polls.map((poll) => ({
    ...poll,
    options: poll.options.map((option, index) => ({
      ...option,
      totals: Object.fromEntries(["available", "unavailable", "maybe"].map((state) => [state, responses.filter((row) => same(row.poll, poll._id) && row.option === index && row.response === state).length])),
      myResponse: responses.find((row) => same(row.poll, poll._id) && same(row.user, userId) && row.option === index)?.response || null,
    })),
  }));
}

export const vote = (user, pollId, option, response) => tx(async () => {
  const poll = await AvailabilityPoll.findByIdAndUpdate(pollId, { $inc: { revision: 1 } }, { returnDocument: "after" });
  if (!poll) throw new AppError("Poll not found.", 404);
  if (!await Membership.exists({ user: user._id, team: { $in: poll.teamIds } })) throw new AppError("Poll participant membership required.", 403);
  if (poll.status !== "open" || poll.closesAt <= new Date()) throw new AppError("Poll is closed.", 409);
  if (!poll.options[option]) throw new AppError("Invalid poll option.", 400);
  return PollResponse.findOneAndUpdate({ poll: pollId, user: user._id, option }, { $set: { response } }, { upsert: true, returnDocument: "after" });
});

export const close = (user, pollId, selectedOption) => tx(async () => {
  const poll = await AvailabilityPoll.findByIdAndUpdate(pollId, { $inc: { revision: 1 } }, { returnDocument: "after" });
  if (!poll) throw new AppError("Poll not found.", 404);
  if (poll.status !== "open") throw new AppError("Poll is already closed.", 409);
  if (poll.match) {
    const match = await lockMatch(poll.match);
    await matchLeader(match, user._id);
    if (match.status !== "scheduled" || match.startsAt <= new Date()) throw new AppError("Only a future scheduled match can be updated from a poll.", 409);
    const selected = poll.options[selectedOption];
    if (!selected) throw new AppError("Choose a valid final time.", 400);
    future(selected.startsAt);
    await ensureFree([match.homeTeam, match.awayTeam], selected.startsAt, selected.endsAt, match._id);
    match.startsAt = selected.startsAt;
    match.endsAt = selected.endsAt;
    match.scheduleProposal = undefined;
    match.scheduleRevision += 1;
    match.reminderRevision += 1;
    await match.save();
    await replaceReminders(match);
  } else {
    const authorized = await Team.exists({ _id: { $in: poll.teamIds }, leader: user._id });
    if (!authorized) throw new AppError("Only the team leader can close this poll.", 403);
    if (!poll.options[selectedOption]) throw new AppError("Choose a valid final option.", 400);
  }
  poll.status = "closed";
  poll.selectedOption = selectedOption;
  await poll.save();
  const recipients = await Membership.find({ team: { $in: poll.teamIds } }).distinct("user");
  for (const recipient of recipients) await notify(recipient, "availability-poll", `The final time has been confirmed. Open the ${poll.match ? "match" : "poll"} to see it in your local time.`, poll._id, "poll", `availability-poll:${poll._id}:closed:${poll.revision}:${recipient}`, poll.match ? `/matches/${poll.match}` : "/teams");
  return poll;
});
