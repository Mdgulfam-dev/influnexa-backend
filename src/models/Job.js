import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, trim: true, uppercase: true, unique: true },
  title: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  experience: { type: String, required: true, trim: true },
  summary: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  responsibilities: [{ type: String, trim: true }],
  requirements: [{ type: String, trim: true }],
  status: { type: String, enum: ["open", "closed", "draft"], default: "open" },
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);
