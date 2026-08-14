import mongoose from "mongoose";

const csvUploadReportSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      default: "",
    },

    totalRecords: {
      type: Number,
      default: 0,
    },

    successfulRecords: {
      type: Number,
      default: 0,
    },
updatedRecords:{
    type:Number,
    default:0
},
    failedRecords: {
      type: Number,
      default: 0,
    },

     report: [
      {
        row:Number,
        fullName: String,
        email: String,
        phoneNumber: String,
        instagramUsername: String,
        youtubeUsername: String,
        status: String,
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const CSVUploadReport =
  mongoose.models.CSVUploadReport ||
  mongoose.model("CSVUploadReport", csvUploadReportSchema);

export default CSVUploadReport;