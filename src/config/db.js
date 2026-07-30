import mongoose from "mongoose";

async function removeLegacyBrandTicketIndex() {
  const collection = mongoose.connection.collection("brandtickets");

  try {
    await collection.dropIndex("ticketId_1");
    console.log("Removed obsolete brandtickets ticketId_1 index.");
  } catch (error) {
    // MongoDB error code 27 means the legacy index does not exist, which is
    // the expected state for new deployments.
    if (error?.code !== 27) {
      throw error;
    }
  }
}

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/influnexa";

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  await removeLegacyBrandTicketIndex();
}
