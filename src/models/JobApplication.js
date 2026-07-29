import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema({
  jobId: { type: String, required: true, trim: true, uppercase: true },
  jobTitle: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  passingYear: { type: String, required: true, trim: true },
  experience: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  coverLetter: { type: String, trim: true },
  resumeName: { type: String, required: true, trim: true },
  resumeData: { type: String, required: true },
  status: { type: String, enum: ["Review", "Shortlisted", "Selected", "Rejected", "On Hold"], default: "Review" },
}, { timestamps: true });

jobApplicationSchema.index({ jobId: 1, createdAt: -1 });
jobApplicationSchema.index({ status: 1, createdAt: -1 });
jobApplicationSchema.index({ email: 1 });
jobApplicationSchema.index({ phone: 1 });
jobApplicationSchema.index({ email: 1, jobId: 1 }, { unique: true });

export default mongoose.model("JobApplication", jobApplicationSchema);
