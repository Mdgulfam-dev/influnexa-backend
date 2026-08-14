import mongoose from "mongoose";

const csvBrandUploadReportSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      trim: true,
    },

    totalRecords: {
      type: Number,
      default: 0,
    },

    successfulRecords: {
      type: Number,
      default: 0,
    },

    updatedRecords: {
      type: Number,
      default: 0,
    },

    failedRecords: {
      type: Number,
      default: 0,
    },

    report: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "CSVBrandUploadReport",
  csvBrandUploadReportSchema
);