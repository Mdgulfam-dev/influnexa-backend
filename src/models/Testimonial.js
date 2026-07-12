import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    quote: { type: String, required: true, trim: true, maxlength: 600 },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Testimonial", testimonialSchema);
