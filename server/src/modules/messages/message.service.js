import Message from "./message.model.js";
import Match from "../matches/match.model.js";

import { access, recipients } from "../conversations/conversation.service.js";

import { tx, lockTeams, must } from "../../services/access.service.js";

import { emitUser } from "../../sockets/index.js";
import { logger } from "../../utils/logger.js";
import { notify } from "../notifications/notification.service.js";
import { viewersOfConversation } from "../../sockets/index.js";
import AppError from "../../utils/AppError.js";

export async function list(user, query) {
  await access(query.conversationId, user._id);

  return Message.find({
    conversation: query.conversationId,
  })
    .sort({
      createdAt: -1,
      _id: -1,
    })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);
}

export async function send(user, data) {
  let message;

  try {
    message = await tx(async () => {
      let conversation = await access(data.conversationId, user._id);

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
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    // Another simultaneous request may have saved this message.
    // Recheck access before returning the committed record.
    await access(data.conversationId, user._id);

    message = await Message.findOne({
      conversation: data.conversationId,
      sender: user._id,
      clientId: data.clientId,
    });

    if (!message) {
      throw error;
    }

    if (message.text !== data.text) {
      throw new AppError("clientId was already used for different text.", 409);
    }
  }

  // Persist unread updates after the message transaction commits. A retry
  // reuses the same message ID and therefore the same notification key.
  const conversation = await access(data.conversationId, user._id);
  const recipientsList = await recipients(conversation);
  const activeViewers = await viewersOfConversation(conversation._id);
  for (const recipient of recipientsList) {
    if (
      String(recipient) !== String(user._id) &&
      !activeViewers.has(String(recipient))
    ) {
      await notify(
        recipient,
        "message",
        "You have a new message.",
        conversation._id,
        "conversation",
        `message:${message._id}:${recipient}`,
        `/messages/${conversation._id}`,
      );
    }
  }

  // Send realtime events only after the transaction commits.
  try {
    for (const recipient of recipientsList) {
      emitUser(recipient, "message:new", message.toJSON());
    }
  } catch (error) {
    logger.error("Message saved; realtime push failed", error);
  }

  return message;
}
