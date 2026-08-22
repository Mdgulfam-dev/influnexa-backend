import mongoose from "mongoose";

const csvBrandSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      trim: true,
    },

    fullName: {
      type: String,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },

    officialEmail: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },

    mobileNumber: {
      type: String,
      trim: true,
      sparse: true,
    },

    linkedinProfile: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    directors: {
      type: String,
      trim: true,
    },

    ageOfCompany: {
      type: String,
      trim: true,
    },

    websiteUrl: {
      type: String,
      trim: true,
    },

    dataType: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
    "Reachout",
    "Followup-1",
    "Followup-2",
    "Followup-3",
    "Nurture",
    "Interested",
    "Proposal Sent",
    "Negotiation",
    "Won",
    "Lost/Not Interested",
    "No Response",
      ],
      default: "Pending",
    },
statusChangedAt: {
  type: Date,
  default: Date.now,
},
    actionButton: {
      type: String,
      trim: true,
    },

    editStatus: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CsvBrand", csvBrandSchema);