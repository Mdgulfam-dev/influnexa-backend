import crypto from "crypto";
import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "editor"],
      default: "admin",
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
    sessionTokenHash: { type: String, trim: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return { hash, salt };
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

adminUserSchema.methods.verifyPassword = function verifyPassword(password) {
  const { hash } = hashPassword(password, this.passwordSalt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(this.passwordHash));
};

adminUserSchema.methods.setPassword = function setPassword(password) {
  const { hash, salt } = hashPassword(password);
  this.passwordHash = hash;
  this.passwordSalt = salt;
};

export default mongoose.model("AdminUser", adminUserSchema);
