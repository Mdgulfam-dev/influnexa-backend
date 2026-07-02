import mongoose from "mongoose";

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/influnexa";

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
}
