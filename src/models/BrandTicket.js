import mongoose from "mongoose";

export const ticketStatuses = ["Draft", "Planned", "Active", "On Hold", "Completed", "Cancelled"];

const brandTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, trim: true },
    brandName: { type: String, required: true, trim: true },
    campaignName: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    objective: { type: String, trim: true },
    platforms: [{ type: String, trim: true }],
    startDate: Date,
    endDate: Date,
    budget: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, default: "USD" },
    status: { type: String, enum: ticketStatuses, default: "Draft" },
    notes: { type: String, trim: true },
    metrics: {
      creators: { type: Number, min: 0, default: 0 },
      posts: { type: Number, min: 0, default: 0 },
      reach: { type: Number, min: 0, default: 0 },
      impressions: { type: Number, min: 0, default: 0 },
      engagements: { type: Number, min: 0, default: 0 },
      clicks: { type: Number, min: 0, default: 0 },
      conversions: { type: Number, min: 0, default: 0 },
      spend: { type: Number, min: 0, default: 0 },
    },
  },
  { timestamps: true }
);

brandTicketSchema.index({ status: 1, createdAt: -1 });
brandTicketSchema.index({ brandName: 1, campaignName: 1 });

export default mongoose.model("BrandTicket", brandTicketSchema);
