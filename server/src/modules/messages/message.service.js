import Message from "./message.model.js";
import Match from "../matches/match.model.js";

import {
  access,
  recipients,
} from "../conversations/conversation.service.js";

import {
  tx,
  lockTeams,
  must,
} from "../../services/access.service.js";

import { emitUser } from "../../sockets/index.js";
import { logger } from "../../utils/logger.js";
import AppError from "../../utils/AppError.js";

export async function list(user, query) {
  await access(query.conversationId, user._id);

  return Message.find({
    conversation: query.conversationId,
  })
    .sort({ createdAt: -1, _id: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);
}

export async function send(user, data) {
  const message = await tx(async () => {
    let conversation = await access(
      data.conversationId,
      user._id,
    );

    if (conversation.team) {
      await lockTeams([conversation.team]);
    }

    if (conversation.match) {
      const match = await must(Match, conversation.match);
      await lockTeams([match.homeTeam, match.awayTeam]);
    }

    conversation = await access(conversation._id, user._id);

    const existing = await Message.findOne({
      conversation: conversation._id,
      sender: user._id,
      clientId: data.clientId,
    });

    if (existing) {
      if (existing.text !== data.text) {
        throw new AppError(
          "clientId was already used for different text.",
          409,
        );
      }

      return existing;
    }

    return Message.create({
      conversation: conversation._id,
      sender: user._id,
      text: data.text,
      clientId: data.clientId,
    });
  });

  // Emit after the database transaction commits.
  try {
    const conversation = await access(
      data.conversationId,
      user._id,
    );

    for (const id of await recipients(conversation)) {
      emitUser(id, "message:new", message.toJSON());
    }
  } catch (error) {
    logger.error("Message saved; realtime push failed", error);
  }

  return message;
}