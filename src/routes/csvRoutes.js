import express from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import uploadCSV from "../middleware/uploadCSV.js";

import {
  uploadCreatorsCSV,
  getLatestCSVReport,
  deleteCSVCreators,
  getCsvCreators,
  deleteCsvCreator,
  updateCsvCreator,
  getCsvFilterOptions,
} from "../controller/csvCreatorController.js";


const router = express.Router();


// Upload CSV File
router.post(
  "/upload",
  requireAdmin,
  uploadCSV.single("file"),
  uploadCreatorsCSV
);


// Get All CSV Creators
router.get(
  "/",
  getCsvCreators
);


// Latest Upload Report
router.get(
  "/latest-report",
  getLatestCSVReport
);

// Update CSV Creator
router.put(
  "/:id",
   requireAdmin,
  updateCsvCreator
);

// Delete Single CSV Creator
router.delete(
  "/:id",
  deleteCsvCreator
);


// Delete All CSV Creators
router.delete(
  "/",
  deleteCSVCreators
);
router.get(
  "/filter-options",
  getCsvFilterOptions
);

export default router;