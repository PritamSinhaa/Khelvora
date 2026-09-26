import User from "./user.model.js";
import {
  activeUser,
  ensureUnblocked,
} from "../../services/access.service.js";
import { accountView } from "../auth/auth.service.js";
import { reverseGeocode } from "../../services/reverseGeocode.service.js";
import { playerHistory } from "../statistics/statistics.service.js";

export async function me(user) {
  return {
    ...accountView(user),
    location: user.location,
  };
}

export async function update(user, data) {
  const record = await User.findByIdAndUpdate(
    user._id,
    { $set: data },
    { new: true, runValidators: true },
  );

  return {
    ...accountView(record),
    location: record.location,
  };
}

export async function profile(user, id) {
  await ensureUnblocked(user._id, id);

  const record = await activeUser(id);

  return {
    id: record.id,
    name: record.name,
    avatarUrl: record.avatarUrl,
    bio: record.bio,
    city: record.city,
  };
}

export const lookupLocation = ({ lat, lon }) => reverseGeocode(lat, lon);
export const matchHistory = (user, query) => playerHistory(user._id, query);
