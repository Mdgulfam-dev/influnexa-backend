import express from "express";

import {
  uploadBrandsCSV,
  updateCsvBrand,
  getLatestCSVBrandReport,
  getCsvBrands,
  deleteCsvBrand,
  deleteAllCsvBrands,
   getCsvBrandFilterOptions,

} from "../controller/csvBrandController.js";

import uploadCSV from "../middleware/uploadCSV.js";

const router = express.Router();


// ========================================
// UPLOAD BRAND CSV
// POST /api/csv-brands/upload
// ========================================
// ========================================
// GET CSV BRANDS
// GET /api/csv-brands
// ========================================


router.post(
  "/upload",
  uploadCSV.single("file"),
  uploadBrandsCSV
);


router.get(
  "/filter-options",
  getCsvBrandFilterOptions
);
router.get(
  "/",
  getCsvBrands
);
// ========================================
// UPDATE CSV BRAND
// PUT /api/csv-brands/:id
// ========================================




router.put(
  "/:id",
  updateCsvBrand
);


// ========================================
// GET LATEST BRAND CSV REPORT
// GET /api/csv-brands/latest-report
// ========================================

router.get(
  "/latest-report",
  getLatestCSVBrandReport
);
// ========================================
// DELETE ALL CSV BRANDS
// DELETE /api/csv-brands
// ========================================

router.delete(
  "/",
  deleteAllCsvBrands
);


// ========================================
// DELETE SINGLE CSV BRAND
// DELETE /api/csv-brands/:id
// ========================================

router.delete(
  "/:id",
  deleteCsvBrand
);

export default router;