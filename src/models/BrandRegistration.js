import mongoose from "mongoose";

export const brandStatuses = [
  "New",
  "Under Review",
  "Contacted",
  "Follow-up 1",
  "Follow-up 2",
  "Meeting Scheduled",
  "Requirement Received",
  "Proposal Sent",
  "Negotiation",
  "Deal Won",
  "Campaign Started",
  "Campaign Completed",
  "Repeat Client",
  "No Response",
  "Lost",
  "Closed",
  "new",
  "contacted",
  "qualified",
  "closed",
];

const brandRegistrationSchema = new mongoose.Schema(
  {
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    companyName: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    productUrl: { type: String, trim: true },
    campaignTypes: [{ type: String, trim: true }],
    campaignGoals: { type: String, required: true, trim: true },
    targetAudience: { type: String, required: true, trim: true },
    targetCountries: { type: String, trim: true },
    preferredPlatforms: [{ type: String, trim: true }],
    creatorCount: { type: String, trim: true },
    budgetCurrency: { type: String, trim: true },
    budgetRange: { type: String, required: true, trim: true },
    timeline: { type: String, trim: true },
    productShippingReady: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: brandStatuses,
      default: "New",
    },
  },
  { timestamps: true }
);

export default mongoose.model("BrandRegistration", brandRegistrationSchema);
