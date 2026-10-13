import mongoose from "mongoose";
import Match from "../matches/match.model.js";
import Result from "../results/result.model.js";
import Team from "../teams/team.model.js";
import Attendance from "../attendance/attendance.model.js";
import Sport from "../sports/sport.model.js";
import { must } from "../../services/access.service.js";
import { escapeRegex } from "../../utils/http.js";

const id = (value) => new mongoose.Types.ObjectId(value);
const matchCollection = () => Match.collection.name;
const teamCollection = () => Team.collection.name;
const sportCollection = () => Sport.collection.name;

function completedRows(teamId) {
  const team = id(teamId);
  return [
    { $match: { status: "confirmed" } },
    { $lookup: { from: matchCollection(), localField: "match", foreignField: "_id", as: "matchDoc" } },
    { $unwind: "$matchDoc" },
    { $match: { "matchDoc.status": "completed", $or: [{ "matchDoc.homeTeam": team }, { "matchDoc.awayTeam": team }] } },
    { $set: { isHome: { $eq: ["$matchDoc.homeTeam", team] } } },
    { $set: { ownScore: { $cond: ["$isHome", "$homeScore", "$awayScore"] }, opponentScore: { $cond: ["$isHome", "$awayScore", "$homeScore"] } } },
    { $set: { outcome: { $switch: { branches: [{ case: { $gt: ["$ownScore", "$opponentScore"] }, then: "W" }, { case: { $lt: ["$ownScore", "$opponentScore"] }, then: "L" }], default: "D" } } } },
  ];
}

export async function teamStats(teamId) {
  await must(Team, teamId);
  const [stats] = await Result.aggregate([
    ...completedRows(teamId),
    { $sort: { "matchDoc.startsAt": -1, "matchDoc._id": -1 } },
    { $group: {
      _id: null,
      completedMatches: { $sum: 1 },
      wins: { $sum: { $cond: [{ $eq: ["$outcome", "W"] }, 1, 0] } },
      draws: { $sum: { $cond: [{ $eq: ["$outcome", "D"] }, 1, 0] } },
      losses: { $sum: { $cond: [{ $eq: ["$outcome", "L"] }, 1, 0] } },
      recentForm: { $push: { outcome: "$outcome", startsAt: "$matchDoc.startsAt", ownScore: "$ownScore", opponentScore: "$opponentScore" } },
    } },
    { $project: {
      _id: 0,
      played: "$completedMatches",
      completedMatches: 1,
      wins: 1,
      draws: 1,
      losses: 1,
      winPercentage: { $round: [{ $multiply: [{ $divide: ["$wins", "$completedMatches"] }, 100] }, 1] },
      recentForm: { $slice: ["$recentForm", 5] },
    } },
  ]);
  return stats || { played: 0, completedMatches: 0, wins: 0, draws: 0, losses: 0, winPercentage: 0, recentForm: [] };
}

export async function teamHistory(teamId, query) {
  await must(Team, teamId);
  const conditions = { "matchDoc.status": "completed", $or: [{ "matchDoc.homeTeam": id(teamId) }, { "matchDoc.awayTeam": id(teamId) }] };
  if (query.sport) conditions["matchDoc.sport"] = id(query.sport);
  if (query.from || query.to) {
    conditions["matchDoc.startsAt"] = {};
    if (query.from) conditions["matchDoc.startsAt"].$gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) conditions["matchDoc.startsAt"].$lt = new Date(new Date(`${query.to}T00:00:00.000Z`).getTime() + 86400000);
  }
  const [page] = await Result.aggregate([
    ...completedRows(teamId).slice(0, 3),
    { $match: conditions },
    ...completedRows(teamId).slice(3),
    { $set: { opponentId: { $cond: ["$isHome", "$matchDoc.awayTeam", "$matchDoc.homeTeam"] } } },
    { $lookup: { from: teamCollection(), localField: "opponentId", foreignField: "_id", as: "opponent" } },
    { $unwind: "$opponent" },
    { $lookup: { from: sportCollection(), localField: "matchDoc.sport", foreignField: "_id", as: "sportDoc" } },
    { $unwind: "$sportDoc" },
    { $sort: { "matchDoc.startsAt": -1, "matchDoc._id": -1 } },
    { $facet: {
      items: [
        { $skip: (query.page - 1) * query.limit },
        { $limit: query.limit },
        { $project: { _id: 0, matchId: "$matchDoc._id", startsAt: "$matchDoc.startsAt", sport: { _id: "$sportDoc._id", name: "$sportDoc.name" }, opponent: { _id: "$opponent._id", name: "$opponent.name" }, isHome: 1, homeScore: 1, awayScore: 1, ownScore: 1, opponentScore: 1, outcome: 1 } },
      ],
      total: [{ $count: "value" }],
    } },
  ]);
  return { items: page?.items || [], total: page?.total[0]?.value || 0, page: query.page, limit: query.limit };
}

export async function playerHistory(userId, query) {
  const attendanceMatches = await Attendance.distinct("match", { user: userId, response: "yes" });
  const [page] = await Match.aggregate([
    { $match: { status: "completed", $or: [{ homeRosterUserIds: id(userId) }, { awayRosterUserIds: id(userId) }, { _id: { $in: attendanceMatches } }] } },
    { $lookup: { from: Result.collection.name, let: { matchId: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$match", "$$matchId"] }, status: "confirmed" } }], as: "result" } },
    { $unwind: "$result" },
    { $lookup: { from: Attendance.collection.name, let: { matchId: "$_id" }, pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$match", "$$matchId"] }, { $eq: ["$user", id(userId)] }, { $eq: ["$response", "yes"] }] } } }], as: "attendanceRecord" } },
    { $set: {
      attendanceRecord: { $arrayElemAt: ["$attendanceRecord", 0] },
      isHome: { $or: [{ $in: [id(userId), { $ifNull: ["$homeRosterUserIds", []] }] }, { $eq: [{ $arrayElemAt: ["$attendanceRecord.teamAtResponse", 0] }, "$homeTeam"] }] },
      isAway: { $or: [{ $in: [id(userId), { $ifNull: ["$awayRosterUserIds", []] }] }, { $eq: [{ $arrayElemAt: ["$attendanceRecord.teamAtResponse", 0] }, "$awayTeam"] }] },
    } },
    { $set: { participationSide: { $switch: { branches: [{ case: "$isHome", then: "home" }, { case: "$isAway", then: "away" }], default: null } } } },
    { $lookup: { from: teamCollection(), localField: "homeTeam", foreignField: "_id", as: "home" } },
    { $lookup: { from: teamCollection(), localField: "awayTeam", foreignField: "_id", as: "away" } },
    { $lookup: { from: sportCollection(), localField: "sport", foreignField: "_id", as: "sportDoc" } },
    { $unwind: "$home" }, { $unwind: "$away" }, { $unwind: "$sportDoc" },
    { $sort: { startsAt: -1, _id: -1 } },
    { $facet: {
      items: [
        { $skip: (query.page - 1) * query.limit }, { $limit: query.limit },
        { $project: {
          _id: 0,
          matchId: "$_id",
          startsAt: 1,
          sport: { _id: "$sportDoc._id", name: "$sportDoc.name" },
          home: { _id: "$home._id", name: "$home.name" },
          away: { _id: "$away._id", name: "$away.name" },
          homeScore: "$result.homeScore",
          awayScore: "$result.awayScore",
          participationSource: { $cond: [{ $or: [{ $in: [id(userId), { $ifNull: ["$homeRosterUserIds", []] }] }, { $in: [id(userId), { $ifNull: ["$awayRosterUserIds", []] }] }] }, "Roster when the match was scheduled", "Marked as playing" ] },
          playerResult: { $switch: { branches: [
            { case: { $and: ["$isHome", "$isAway"] }, then: "recorded in both team rosters" },
            { case: { $eq: ["$participationSide", "home"] }, then: { $switch: { branches: [{ case: { $gt: ["$result.homeScore", "$result.awayScore"] }, then: "win" }, { case: { $lt: ["$result.homeScore", "$result.awayScore"] }, then: "loss" }], default: "draw" } } },
            { case: { $eq: ["$participationSide", "away"] }, then: { $switch: { branches: [{ case: { $gt: ["$result.awayScore", "$result.homeScore"] }, then: "win" }, { case: { $lt: ["$result.awayScore", "$result.homeScore"] }, then: "loss" }], default: "draw" } } },
          ], default: null } },
        } },
      ],
      total: [{ $count: "value" }],
      summary: [{ $group: {
        _id: null,
        matches: { $sum: { $cond: [{ $in: ["$participationSide", ["home", "away"]] }, 1, 0] } },
        wins: { $sum: { $cond: [{ $or: [
          { $and: [{ $eq: ["$participationSide", "home"] }, { $gt: ["$result.homeScore", "$result.awayScore"] }] },
          { $and: [{ $eq: ["$participationSide", "away"] }, { $gt: ["$result.awayScore", "$result.homeScore"] }] },
        ] }, 1, 0] } },
        draws: { $sum: { $cond: [{ $and: [
          { $in: ["$participationSide", ["home", "away"]] },
          { $eq: ["$result.homeScore", "$result.awayScore"] },
        ] }, 1, 0] } },
      } }, { $project: {
        _id: 0,
        matches: 1,
        wins: 1,
        winRate: { $cond: [{ $gt: ["$matches", 0] }, { $round: [{ $multiply: [{ $divide: ["$wins", "$matches"] }, 100] }, 0] }, 0] },
      } }],
    } },
  ]);
  return { items: page?.items || [], total: page?.total[0]?.value || 0, summary: page?.summary[0] || { matches: 0, wins: 0, draws: 0, winRate: 0 }, page: query.page, limit: query.limit, participationSourceNote: "History uses saved match roster snapshots or a previous yes attendance response. Current team membership is not used." };
}

export async function teamLeaderboard(query) {
  await must(Sport, query.sport);
  const sportId = id(query.sport);
  const dateFilter = query.season ? { $gte: new Date(`${query.season}-01-01T00:00:00.000Z`), $lt: new Date(`${Number(query.season) + 1}-01-01T00:00:00.000Z`) } : null;
  const matchConditions = { "matchDoc.status": "completed", "matchDoc.sport": sportId, ...(dateFilter ? { "matchDoc.startsAt": dateFilter } : {}) };
  const pipeline = [
    { $match: { status: "confirmed" } },
    { $lookup: { from: matchCollection(), localField: "match", foreignField: "_id", as: "matchDoc" } },
    { $unwind: "$matchDoc" },
    { $match: matchConditions },
      { $project: { sport: "$matchDoc.sport", sides: [
      { teamId: "$matchDoc.homeTeam", ownScore: "$homeScore", opponentScore: "$awayScore" },
      { teamId: "$matchDoc.awayTeam", ownScore: "$awayScore", opponentScore: "$homeScore" },
    ] } },
    { $unwind: "$sides" },
    { $lookup: { from: teamCollection(), localField: "sides.teamId", foreignField: "_id", as: "team" } },
    { $unwind: "$team" },
    ...(query.city ? [{ $match: { "team.city": new RegExp(`^${escapeRegex(query.city.trim())}$`, "i") } }] : []),
    { $group: {
      _id: "$sides.teamId",
      teamName: { $first: "$team.name" },
      city: { $first: "$team.city" },
      sport: { $first: "$sport" },
      completedMatches: { $sum: 1 },
      wins: { $sum: { $cond: [{ $gt: ["$sides.ownScore", "$sides.opponentScore"] }, 1, 0] } },
      draws: { $sum: { $cond: [{ $eq: ["$sides.ownScore", "$sides.opponentScore"] }, 1, 0] } },
      losses: { $sum: { $cond: [{ $lt: ["$sides.ownScore", "$sides.opponentScore"] }, 1, 0] } },
    } },
    { $match: { completedMatches: { $gte: 5 } } },
    { $set: { winPercentage: { $round: [{ $multiply: [{ $divide: ["$wins", "$completedMatches"] }, 100] }, 1] } } },
    { $sort: { wins: -1, winPercentage: -1, draws: -1, losses: 1, teamName: 1, _id: 1 } },
    { $facet: {
      items: [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }, { $project: { teamId: "$_id", _id: 0, teamName: 1, city: 1, sport: 1, completedMatches: 1, wins: 1, draws: 1, losses: 1, winPercentage: 1 } }],
      total: [{ $count: "value" }],
    } },
  ];
  const [page] = await Result.aggregate(pipeline);
  return {
    items: page?.items || [],
    total: page?.total[0]?.value || 0,
    page: query.page,
    limit: query.limit,
    rules: { minimumMatches: 5, season: query.season ? `UTC calendar year ${query.season}` : "All-time", sport: "Leaderboards are separated by sport.", ranking: "Wins descending, win percentage descending, draws descending, losses ascending, then team name ascending." },
  };
}
