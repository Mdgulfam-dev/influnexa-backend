import express from "express";
import Job from "../models/Job.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : { status: "open" };
    res.json({ jobs: await Job.find(filter).sort({ createdAt: -1 }).lean() });
  } catch (error) { next(error); }
});

router.get("/:jobId", async (req, res, next) => {
  try {
    const job = await Job.findOne({ jobId: req.params.jobId.toUpperCase(), status: "open" }).lean();
    if (!job) return res.status(404).json({ message: "Job not found." });
    return res.json({ job });
  } catch (error) { return next(error); }
});

export default router;
