import mongoose from "mongoose";

const influencerRegistrationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    creatorName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    languages: { type: String, required: true, trim: true },
    languageTags: [{ type: String, trim: true, lowercase: true }],
    categories: [{ type: String, trim: true }],
    primaryPlatform: { type: String, required: true, trim: true },
    primaryProfile: { type: String, required: true, trim: true, lowercase: true, unique: true },
    otherProfiles: { type: String, trim: true },
    followers: { type: String, required: true, trim: true },
    followerCount: { type: Number, min: 0 },
    engagementRate: { type: String, trim: true },
    averageViews: { type: String, trim: true },
    audienceCountries: { type: String, trim: true },
    contentTypes: [{ type: String, trim: true }],
    pastBrandWork: { type: String, trim: true },
    rateCard: { type: String, trim: true },
    shippingAddress: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
    notes: { type: String, trim: true },
    consentToContact: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ["new", "reviewing", "approved", "rejected"],
      default: "new",
    },
  },
  { timestamps: true }
);

influencerRegistrationSchema.index({ status: 1, createdAt: -1 });
influencerRegistrationSchema.index({ createdAt: -1, _id: -1 });
influencerRegistrationSchema.index({ country: 1, createdAt: -1 });
influencerRegistrationSchema.index({ state: 1, createdAt: -1 });
influencerRegistrationSchema.index({ city: 1, createdAt: -1 });
influencerRegistrationSchema.index({ languageTags: 1, createdAt: -1 });
influencerRegistrationSchema.index({ followerCount: 1, createdAt: -1 });
influencerRegistrationSchema.index({ primaryPlatform: 1, createdAt: -1 });
influencerRegistrationSchema.index({ categories: 1, createdAt: -1 });
influencerRegistrationSchema.index({ status: 1, country: 1, createdAt: -1 });
influencerRegistrationSchema.index({ status: 1, primaryPlatform: 1, createdAt: -1 });
influencerRegistrationSchema.index({ creatorName: 1 });
influencerRegistrationSchema.index({
  creatorName: "text",
  fullName: "text",
  email: "text",
  phone: "text",
  country: "text",
  city: "text",
  primaryPlatform: "text",
  categories: "text",
});

export default mongoose.model("InfluencerRegistration", influencerRegistrationSchema);
