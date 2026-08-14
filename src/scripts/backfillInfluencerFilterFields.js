import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import InfluencerRegistration from "../models/InfluencerRegistration.js";

dotenv.config();

function languageTags(value) {
  return String(value || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function followerCount(value) {
  const match = String(value || "").toLowerCase().replace(/,/g, "").match(/([\d.]+)\s*(k|m|million|b|billion)?/);
  if (!match) return null;
  const multiplier = { k: 1_000, m: 1_000_000, million: 1_000_000, b: 1_000_000_000, billion: 1_000_000_000 }[match[2]] || 1;
  return Math.round(Number(match[1]) * multiplier);
}

try {
  await connectDatabase();
  const cursor = InfluencerRegistration.find({}, { languages: 1, followers: 1 }).lean().cursor();
  const operations = [];

  for await (const influencer of cursor) {
    operations.push({
      updateOne: {
        filter: { _id: influencer._id },
        update: { $set: { languageTags: languageTags(influencer.languages), followerCount: followerCount(influencer.followers) } },
      },
    });
    if (operations.length === 1000) {
      await InfluencerRegistration.bulkWrite(operations, { ordered: false });
      operations.length = 0;
    }
  }
  if (operations.length) await InfluencerRegistration.bulkWrite(operations, { ordered: false });
  console.log("Influencer filter fields backfilled.");
} finally {
  await mongoose.disconnect();
}
