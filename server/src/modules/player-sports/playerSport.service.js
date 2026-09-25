import PlayerSport from "./playerSport.model.js";
import { sportExists } from "../../services/access.service.js";

export async function mine(user) {
  return PlayerSport.find({
    user: user._id,
  }).populate("sport");
}

export async function save(user, data) {
  await sportExists(data.sport);

  return PlayerSport.findOneAndUpdate(
    {
      user: user._id,
      sport: data.sport,
    },
    {
      $set: {
        skillLevel: data.skillLevel,
        positions: data.positions,
        availability: data.availability,
        timeZone: data.timeZone,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
}

export async function remove(user, sportId) {
  await PlayerSport.deleteOne({
    user: user._id,
    sport: sportId,
  });

  return { removed: true };
}