import mongoose from "mongoose";

import { connectDatabase } from "../src/config/database.js";
import Sport from "../src/modules/sports/sport.model.js";
import { sportSeeds } from "../src/constants/sports.js";

async function seedSports() {
  try {
    await connectDatabase();

    for (const sport of sportSeeds) {
      await Sport.updateOne(
        { slug: sport.slug },
        { $set: sport },
        {
          upsert: true,
          runValidators: true,
        },
      );
    }

    console.log("Sports seeded successfully.");
  } catch (error) {
    console.error("Sports seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedSports();