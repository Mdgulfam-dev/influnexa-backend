import express from "express";

import {
  getLeadWorkflow,
  createLeadWorkflow,
  getBrandWorkflow,
} from "../controller/leadWorkflowController.js";



const router = express.Router();

// ============================================================
// GET ALL BRAND WORKFLOW STATISTICS
// ============================================================
// Example:
// GET /admin/lead-workflow
// GET /admin/lead-workflow?page=1&limit=20
// GET /admin/lead-workflow?search=sania
// GET /admin/lead-workflow?status=Won

router.get(
  "/",
 
  getLeadWorkflow
);

// ============================================================
// CREATE BRAND WORKFLOW EVENT
// ============================================================
// Example:
// POST /admin/lead-workflow

router.post(
  "/",
  
  createLeadWorkflow
);

// ============================================================
// GET WORKFLOW FOR ONE BRAND
// ============================================================
// Example:
// GET /admin/lead-workflow/68abc123...

router.get(
  "/:leadId",
 
  getBrandWorkflow
);

export default router;