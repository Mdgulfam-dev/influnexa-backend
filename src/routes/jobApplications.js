import express from "express";
import JobApplication from "../models/JobApplication.js";
import Job from "../models/Job.js";

const router = express.Router();
const requiredFields = ["jobId", "jobTitle", "name", "email", "phone", "passingYear", "experience", "address", "resumeName", "resumeData"];

router.post("/", async (req, res, next) => {
  try {
    const missing = requiredFields.filter((field) => !String(req.body[field] || "").trim());
    if (missing.length) return res.status(400).json({ message: "Please complete all required application fields.", missing });
    if (!/^data:application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document);base64,/.test(req.body.resumeData)) {
      return res.status(400).json({ message: "Please upload a PDF or Word resume." });
    }
    if (req.body.resumeData.length > 950000) return res.status(400).json({ message: "Please upload a resume smaller than 700 KB." });
    const matchingJob = await Job.findOne({ jobId: req.body.jobId.trim().toUpperCase() });
    if (matchingJob && matchingJob.status !== "open") return res.status(404).json({ message: "This job is no longer accepting applications." });
    const application = await JobApplication.create({ ...req.body, jobId: matchingJob?.jobId || req.body.jobId, jobTitle: matchingJob?.title || req.body.jobTitle, email: req.body.email.trim().toLowerCase() });
    return res.status(201).json({ message: "Application submitted successfully.", id: application._id });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "You have already applied for this job with this email address." });
    return next(error);
  }
});

export default router;
