import PlayerSport from "./playerSport.model.js";
import Sport from "../sports/sport.model.js";
import { sportExists } from "../../services/access.service.js";
import AppError from "../../utils/AppError.js";

async function resolveSport(data) {
  if (data.sport !== "__other__") return data.sport;

  const name = data.sportName.trim().replace(/\s+/g, " ");
  const slug = name.toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) throw new AppError("Enter a sport name using letters or numbers.", 400);

  const existing = await Sport.findOne({ slug });
  if (existing) return existing._id;

  try {
    const created = await Sport.create({ slug, name, defaultTeamSize: 1 });
    return created._id;
  } catch (error) {
    if (error.code !== 11000) throw error;
    const raced = await Sport.findOne({ slug });
    if (raced) return raced._id;
    throw error;
  }
}

export async function mine(user) {
  return PlayerSport.find({
    user: user._id,
  }).populate("sport");
}

export async function save(user, data) {
  const sport = await resolveSport(data);
  await sportExists(sport);

  return PlayerSport.findOneAndUpdate(
    {
      user: user._id,
      sport,
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
