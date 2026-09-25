import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

import User from "../src/modules/users/user.model.js";
import Sport from "../src/modules/sports/sport.model.js";
import PlayerSport from "../src/modules/player-sports/playerSport.model.js";
import Team from "../src/modules/teams/team.model.js";
import Membership from "../src/modules/memberships/membership.model.js";
import Challenge from "../src/modules/challenges/challenge.model.js";
import Match from "../src/modules/matches/match.model.js";
import Result from "../src/modules/results/result.model.js";
import Attendance from "../src/modules/attendance/attendance.model.js";
import Conversation from "../src/modules/conversations/conversation.model.js";
import Message from "../src/modules/messages/message.model.js";
import OpenGame from "../src/modules/open-games/openGame.model.js";
import Notification from "../src/modules/notifications/notification.model.js";
import { sportSeeds, skillLevels } from "../src/constants/sports.js";

const DAY = 86400000;
const MEMBERS = 8;
const VERSION = 1;

const firstNames = [
  "Aman",
  "Riya",
  "Arjun",
  "Neha",
  "Kabir",
  "Isha",
  "Dev",
  "Ananya",
  "Rohan",
  "Meera",
  "Karan",
  "Aditi",
];

const lastNames = [
  "Sharma",
  "Singh",
  "Das",
  "Kaur",
  "Verma",
  "Rao",
  "Bose",
  "Gill",
  "Patel",
  "Sinha",
  "Roy",
  "Kapoor",
];

const teamNames = [
  "Falcons",
  "Warriors",
  "United",
  "Titans",
  "Rangers",
  "Strikers",
  "Royals",
  "Eagles",
  "Panthers",
  "Legends",
];

const chatLines = [
  "Who is coming to practice?",
  "I can join this weekend.",
  "Please bring water and your kit.",
  "Let’s meet at the ground early.",
  "Looking forward to the game!",
  "Great teamwork today.",
];

export function readConfig(env = process.env) {
  const number = (key, fallback, min, max) => {
    const value = Number(env[key] ?? fallback);

    if (!Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${key} must be an integer between ${min} and ${max}.`);
    }

    return value;
  };

  const config = {
    version: VERSION,
    batch: env.DEMO_BATCH || "demo-v1",
    users: number("DEMO_USERS", 1000, 144, 50000),
    teams: number("DEMO_TEAMS", 100, 18, 5000),
    matches: number("DEMO_MATCHES", 200, 0, 20000),
    games: number("DEMO_GAMES", 100, 0, 20000),
    messages: number("DEMO_MESSAGES", 3000, 0, 100000),
    city: env.DEMO_CITY || "Mohali",
    latitude: Number(env.DEMO_LATITUDE || 30.7046),
    longitude: Number(env.DEMO_LONGITUDE || 76.7179),
  };

  if (!/^[a-z0-9-]{1,24}$/.test(config.batch)) {
    throw new Error(
      "DEMO_BATCH: use 1–24 lowercase letters, digits or hyphens.",
    );
  }

  if (config.teams * MEMBERS > config.users) {
    throw new Error("DEMO_USERS must be at least DEMO_TEAMS × 8.");
  }

  if (config.teams < sportSeeds.length * 2) {
    throw new Error("Create at least two teams per sport.");
  }

  if (
    !Number.isFinite(config.latitude) ||
    Math.abs(config.latitude) > 85 ||
    !Number.isFinite(config.longitude) ||
    Math.abs(config.longitude) > 179
  ) {
    throw new Error(
      "Enter a valid demo location, away from the poles/dateline.",
    );
  }

  return config;
}

function makeId(batch, kind, index) {
  const hex = createHash("sha256")
    .update(`khelvora-demo:${VERSION}:${batch}:${kind}:${index}`)
    .digest("hex")
    .slice(0, 24);

  return new mongoose.Types.ObjectId(hex);
}

function messageClientId(batch, index) {
  const hex = createHash("sha256")
    .update(`${batch}:message:${index}`)
    .digest("hex");

  return (
    `${hex.slice(0, 8)}-` +
    `${hex.slice(8, 12)}-` +
    `4${hex.slice(13, 16)}-` +
    `8${hex.slice(17, 20)}-` +
    `${hex.slice(20, 32)}`
  );
}

export function buildDataset(
  config,
  sports,
  passwordHash,
  anchor = new Date(),
) {
  const groups = new Map();
  const membersByTeam = new Map();
  const speakersByChat = new Map();

  const id = (kind, index) => makeId(config.batch, kind, index);

  const time = (days) => new Date(+anchor + days * DAY);

  const createdAt = time(-config.matches - 30);

  const location = (index) => ({
    type: "Point",
    coordinates:
      index === 0
        ? [config.longitude, config.latitude]
        : [
            config.longitude + (((index * 47) % 101) - 50) * 0.0008,
            config.latitude + (((index * 31) % 103) - 51) * 0.0006,
          ],
  });

  const add = (Model, values) => {
    const document = new Model({
      createdAt,
      updatedAt: createdAt,
      ...values,
    });

    const row = document.toObject({ versionKey: false });

    if (!groups.has(Model)) {
      groups.set(Model, []);
    }

    groups.get(Model).push(row);

    return row;
  };

  const venue = (index) => ({
    name: `${config.city} Community Ground ${(index % 12) + 1}`,
    address: `Sector ${60 + (index % 25)}, ${config.city}`,
    location: location(index),
  });

  const email = (index) => `${config.batch}.player${index + 1}@example.test`;

  // Users
  const users = Array.from({ length: config.users }, (_, index) =>
    add(User, {
      _id: id("user", index),
      name:
        index === 0
          ? "Demo Captain"
          : `${firstNames[index % firstNames.length]} ${
              lastNames[
                Math.floor(index / firstNames.length) % lastNames.length
              ]
            }`,
      email: email(index),
      passwordHash,
      role: "user",
      bio:
        "Synthetic demo player. Available for friendly games " +
        "and weekend practice.",
      city: config.city,
      location: location(index),
    }),
  );

  // Player sport preferences
  users.forEach((user, index) => {
    const primary = Math.floor(index / MEMBERS) % sports.length;

    const choices =
      index === 0
        ? sports
        : [sports[primary], sports[(primary + 1) % sports.length]];

    choices.forEach((sport) =>
      add(PlayerSport, {
        _id: id("player-sport", `${index}:${sport.slug}`),
        user: user._id,
        sport: sport._id,
        skillLevel: skillLevels[index % skillLevels.length],
        positions: [],
        availability: [
          { day: 6, from: "17:00", to: "19:00" },
          { day: 0, from: "08:00", to: "10:00" },
        ],
        timeZone: "Asia/Kolkata",
      }),
    );
  });

  // Teams, memberships and team conversations
  const teams = Array.from({ length: config.teams }, (_, index) => {
    const members = users
      .slice(index * MEMBERS, (index + 1) * MEMBERS)
      .map((user) => user._id);

    const team = add(Team, {
      _id: id("team", index),
      name:
        `${config.city} ` +
        `${teamNames[index % teamNames.length]} ` +
        `${index + 1}`,
      sport: sports[index % sports.length]._id,
      leader: members[0],
      city: config.city,
      location: location(index),
      skillLevel: skillLevels[index % skillLevels.length],
      lookingForPlayers: index % 4 !== 3,
      memberCount: members.length,
      maxMembers: 15,
      bio:
        "Demo team for local sports, friendly matches " +
        "and weekend practice.",
    });

    membersByTeam.set(String(team._id), members);

    members.forEach((user, position) =>
      add(Membership, {
        _id: id("membership", `${index}:${position}`),
        team: team._id,
        user,
      }),
    );

    const chat = add(Conversation, {
      _id: id("team-chat", index),
      kind: "team",
      team: team._id,
      key: `team:${team._id}`,
    });

    speakersByChat.set(String(chat._id), members);

    return team;
  });

  const rivalOf = (team) =>
    teams.find(
      (candidate) =>
        String(candidate.sport) === String(team.sport) &&
        String(candidate._id) !== String(team._id),
    );

  // One pending challenge per team.
  teams.forEach((team, index) => {
    const rival = rivalOf(team);

    const challenge = add(Challenge, {
      _id: id("pending-challenge", index),
      fromTeam: team._id,
      toTeam: rival._id,
      createdBy: team.leader,
      startsAt: time(index + 7),
      endsAt: time(index + 7 + 2 / 24),
      venue: venue(index),
      status: "pending",
      createdAt: anchor,
      updatedAt: anchor,
    });

    add(Notification, {
      _id: id("challenge-notification", index),
      user: rival.leader,
      type: "challenge",
      entityId: String(challenge._id),
      text: `${team.name} sent your team a friendly challenge.`,
      createdAt: anchor,
      updatedAt: anchor,
    });
  });

  // Matches, attendance, results and match conversations
  for (let index = 0; index < config.matches; index++) {
    const home = teams[index % teams.length];
    const away = rivalOf(home);
    const completed = index % 3 === 0;

    const startsAt = time(((completed ? -1 : 1) * (index + 2)) / 4);

    const endsAt = new Date(+startsAt + 2 * 3600000);

    const challenge = add(Challenge, {
      _id: id("accepted-challenge", index),
      fromTeam: home._id,
      toTeam: away._id,
      createdBy: home.leader,
      startsAt,
      endsAt,
      venue: venue(index),
      status: "accepted",
    });

    const match = add(Match, {
      _id: id("match", index),
      challenge: challenge._id,
      homeTeam: home._id,
      awayTeam: away._id,
      sport: home.sport,
      startsAt,
      endsAt,
      venue: venue(index),
      status: completed ? "completed" : "scheduled",
    });

    const members = [
      ...membersByTeam.get(String(home._id)),
      ...membersByTeam.get(String(away._id)),
    ];

    members.forEach((user, position) =>
      add(Attendance, {
        _id: id("attendance", `${index}:${position}`),
        match: match._id,
        user,
        response: position % 7 === 6 ? "maybe" : "yes",
      }),
    );

    const chat = add(Conversation, {
      _id: id("match-chat", index),
      kind: "match",
      match: match._id,
      key: `match:${match._id}`,
    });

    speakersByChat.set(String(chat._id), members);

    if (completed) {
      add(Result, {
        _id: id("result", index),
        match: match._id,
        submittedByTeam: home._id,
        homeScore: index % 5,
        awayScore: (index + 2) % 5,
        status: "confirmed",
        notes: "Synthetic demo result.",
        createdAt: new Date(+endsAt + 3600000),
        updatedAt: new Date(+endsAt + 3600000),
      });
    }
  }

  // Open games
  for (let index = 0; index < config.games; index++) {
    const players = Array.from(
      { length: 3 + (index % 5) },
      (_, position) => users[(index * 7 + position) % users.length]._id,
    );

    const sport = sports[index % sports.length];

    add(OpenGame, {
      _id: id("open-game", index),
      host: players[0],
      sport: sport._id,
      title: `${sport.name} at ${config.city} Ground ${index + 1}`,
      startsAt: time(1 + index / 4),
      endsAt: time(1 + index / 4 + 2 / 24),
      venue: venue(index),
      capacity: 12,
      players,
      status: "open",
    });
  }

  // Conversation messages
  const chats = groups.get(Conversation);

  for (let index = 0; index < config.messages; index++) {
    const chat = chats[index % chats.length];
    const members = speakersByChat.get(String(chat._id));

    add(Message, {
      _id: id("message", index),
      conversation: chat._id,
      sender: members[Math.floor(index / chats.length) % members.length],
      clientId: messageClientId(config.batch, index),
      text: chatLines[index % chatLines.length],
      createdAt: new Date(+anchor - (config.messages - index) * 30000),
      updatedAt: new Date(+anchor - (config.messages - index) * 30000),
    });
  }

  return {
    groups,
    loginEmail: email(0),
  };
}

export async function validateDataset(groups) {
  for (const [Model, documents] of groups) {
    for (let offset = 0; offset < documents.length; offset += 500) {
      await Promise.all(
        documents
          .slice(offset, offset + 500)
          .map((row) => new Model(row).validate()),
      );
    }
  }
}

async function insertMissing(Model, documents) {
  let inserted = 0;

  for (let offset = 0; offset < documents.length; offset += 500) {
    const result = await Model.bulkWrite(
      documents.slice(offset, offset + 500).map((document) => ({
        updateOne: {
          filter: { _id: document._id },
          update: { $setOnInsert: document },
          upsert: true,
          timestamps: false,
        },
      })),
      {
        ordered: true,
        timestamps: false,
      },
    );

    inserted += result.upsertedCount;
  }

  console.log(
    `${Model.modelName}: ${inserted} inserted, ` +
      `${documents.length - inserted} already present`,
  );
}

async function main() {
  dotenv.config({
    path: fileURLToPath(new URL("../.env", import.meta.url)),
    quiet: true,
  });

  const args = process.argv.slice(2);

  if (args.some((arg) => arg !== "--write")) {
    throw new Error("Use no arguments for preview, or --write to insert.");
  }

  const write = args.includes("--write");
  const config = readConfig();
  const database = process.env.DEMO_DB_NAME || "khelvora_demo";
  const password = process.env.DEMO_PASSWORD;

  if (
    !password ||
    password.length < 10 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new Error(
      "Set DEMO_PASSWORD: at least 10 characters " +
        "and at most 72 UTF-8 bytes.",
    );
  }

  if (!/^[A-Za-z0-9_-]{1,63}$/.test(database)) {
    throw new Error("Invalid DEMO_DB_NAME.");
  }

  let passwordHash = await bcrypt.hash(password, 12);
  let anchor = new Date();

  let sports = sportSeeds.map((sport) => ({
    ...sport,
    _id: makeId(config.batch, "sport", sport.slug),
  }));

  let dataset = buildDataset(config, sports, passwordHash, anchor);

  await validateDataset(dataset.groups);

  console.log(`Target database: ${database}; batch: ${config.batch}`);

  console.table(
    [...dataset.groups].map(([Model, documents]) => ({
      collection: Model.collection.name,
      records: documents.length,
    })),
  );

  if (!write) {
    console.log(
      "Preview passed schema validation. " +
        "No database connection or writes were made.",
    );
    console.log("Run npm run seed:demo -- --write when ready.");
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required for --write.");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: database,
    serverSelectionTimeoutMS: 15000,
  });

  const runs = mongoose.connection.collection("demo_seed_runs");

  await runs.updateOne(
    { _id: config.batch },
    {
      $setOnInsert: {
        config,
        anchor,
        passwordHash,
        status: "started",
      },
    },
    { upsert: true },
  );

  const run = await runs.findOne({ _id: config.batch });

  if (JSON.stringify(run.config) !== JSON.stringify(config)) {
    throw new Error(
      "This batch already has different settings. " +
        "Restore its settings or use a new DEMO_BATCH.",
    );
  }

  if (!(await bcrypt.compare(password, run.passwordHash))) {
    throw new Error(
      "DEMO_PASSWORD does not match this batch. " +
        "Restore it or use a new DEMO_BATCH.",
    );
  }

  if (run.status === "complete") {
    console.log("This demo batch is already complete. Nothing changed.");
    return;
  }

  anchor = new Date(run.anchor);
  passwordHash = run.passwordHash;

  // Reuse existing sports by slug.
  await Sport.init();
  sports = [];

  for (const sport of sportSeeds) {
    const savedSport = await Sport.findOneAndUpdate(
      { slug: sport.slug },
      {
        $setOnInsert: {
          ...sport,
          _id: makeId(config.batch, "sport", sport.slug),
          createdAt: anchor,
          updatedAt: anchor,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        timestamps: false,
      },
    ).lean();

    sports.push(savedSport);
  }

  dataset = buildDataset(config, sports, passwordHash, anchor);

  await validateDataset(dataset.groups);

  // Write parent records before dependent records.
  const order = [
    User,
    PlayerSport,
    Team,
    Membership,
    Challenge,
    Match,
    Result,
    Attendance,
    Conversation,
    Message,
    OpenGame,
    Notification,
  ];

  for (const Model of order) {
    await Model.init();
    await insertMissing(Model, dataset.groups.get(Model) || []);
  }

  await runs.updateOne(
    { _id: config.batch },
    {
      $set: {
        status: "complete",
        completedAt: new Date(),
      },
    },
  );

  console.log(
    `Demo ready. Sign in as ${dataset.loginEmail} ` + "using DEMO_PASSWORD.",
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main()
    .catch((error) => {
      // Avoid printing connection credentials.
      console.error(
        error instanceof mongoose.Error.ValidationError
          ? `Schema validation failed for fields: ${Object.keys(
              error.errors,
            ).join(", ")}`
          : error.name === "Error"
            ? error.message
            : `Seed failed (${error.name}). ` +
              "Check database access and schema compatibility.",
      );

      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
