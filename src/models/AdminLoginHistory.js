import mongoose from "mongoose";

const adminLoginHistorySchema = new mongoose.Schema(
  {
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: ["login", "logout"],
      required: true,
    },

     durationMinutes: {
      type: Number,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Automatically remove records older than 7 days
adminLoginHistorySchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 7 * 24 * 60 * 60,
  }
);

export default mongoose.model(
  "AdminLoginHistory",
  adminLoginHistorySchema
);