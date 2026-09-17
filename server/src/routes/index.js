import { Router } from "express";
import mongoose from "mongoose";

import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import sportRoutes from "../modules/sports/sport.routes.js";
import playerSportRoutes from "../modules/player-sports/playerSport.routes.js";
import teamRoutes from "../modules/teams/team.routes.js";
import membershipRoutes from "../modules/memberships/membership.routes.js";
import joinRequestRoutes from "../modules/join-requests/joinRequest.routes.js";
import invitationRoutes from "../modules/invitations/invitation.routes.js";
import challengeRoutes from "../modules/challenges/challenge.routes.js";
import matchRoutes from "../modules/matches/match.routes.js";
import resultRoutes from "../modules/results/result.routes.js";
import conversationRoutes from "../modules/conversations/conversation.routes.js";
import messageRoutes from "../modules/messages/message.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import openGameRoutes from "../modules/open-games/openGame.routes.js";
import discoveryRoutes from "../modules/discovery/discovery.routes.js";
import blockRoutes from "../modules/blocks/block.routes.js";
import reportRoutes from "../modules/reports/report.routes.js";
import uploadRoutes from "../modules/uploads/upload.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Khelvora API is running",
  });
});

router.get("/ready", (req, res) => {
  const ready = mongoose.connection.readyState === 1;

  res.status(ready ? 200 : 503).json({
    success: ready,
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/sports", sportRoutes);
router.use("/player-sports", playerSportRoutes);
router.use("/teams", teamRoutes);
router.use("/memberships", membershipRoutes);
router.use("/join-requests", joinRequestRoutes);
router.use("/invitations", invitationRoutes);
router.use("/challenges", challengeRoutes);
router.use("/matches", matchRoutes);
router.use("/results", resultRoutes);
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/open-games", openGameRoutes);
router.use("/discovery", discoveryRoutes);
router.use("/blocks", blockRoutes);
router.use("/reports", reportRoutes);
router.use("/uploads", uploadRoutes);

export default router;