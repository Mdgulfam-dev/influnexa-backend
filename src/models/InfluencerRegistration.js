import mongoose from "mongoose";

const influencerRegistrationSchema = new mongoose.Schema(
  {
    // Basic Information
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    instagramUsername: {
      type: String,
      default: "",
      trim: true,
    },

    instagramProfileLink: {
      type: String,
      default: "",
      trim: true,
    },

    instagramFollowersRange: {
      type: String,
      default: "",
      trim: true,
    },

    exactFollowers: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Contact
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },

    whatsappNumber: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    // Categories
    categories: {
      type: [String],
      default: [],
    },

    campaignType: {
      type: [String],
      default: [],
    },

    influencerType: {
      type: String,
      default: "",
      trim: true,
    },

    // Personal Information
    gender: {
      type: String,
      default: "",
      trim: true,
    },

    dateOfBirth: {
      type: String,
      default: "",
      trim: true,
    },

    languages: {
      type: [String],
      default: [],
    },

    // Address
    fullAddress: {
      type: String,
      default: "",
      trim: true,
    },

    landmark: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      default: "",
      trim: true,
    },

    // YouTube
    youtubeUsername: {
      type: String,
      default: "",
      trim: true,
    },

    youtubeChannelLink: {
      type: String,
      default: "",
      trim: true,
    },

    youtubeSubscribersRange: {
      type: String,
      default: "",
      trim: true,
    },

    // Commercials
    commercialsFor1InstagramReel: {
      type: Number,
      default: 0,
    },

    photoLink: {
      type: String,
      default: "",
      trim: true,
    },

    commercialsFor1InstagramStory: {
      type: Number,
      default: 0,
    },

    commercialsFor1InstagramPost: {
      type: Number,
      default: 0,
    },

    commercialsFor1DedicatedYouTubeVideo: {
      type: Number,
      default: 0,
    },

    commercialsFor1IntegratedYouTubeVideo: {
      type: Number,
      default: 0,
    },

    commercialsFor1DedicatedYouTubeShortsVideo: {
      type: Number,
      default: 0,
    },

    commercialsFor1IntegratedYouTubeShortsVideo: {
      type: Number,
      default: 0,
    },

    // Other Information
    whatKindOfDealDoYouParticipateIn: {
      type: String,
      default: "",
      trim: true,
    },

    speakingVideoLink: {
      type: String,
      default: "",
      trim: true,
    },

    areYouATvMoviesOttCelebrity: {
      type: String,
      default: "",
      trim: true,
    },

    whatAllPlatformsAreYouAvailableOn: {
      type: [String],
      default: [],
    },

    typeOfCeleb: {
      type: String,
      default: "",
      trim: true,
    },

    howManyAmazonReviewsYouDoPerMonth: {
      type: Number,
      default: 0,
    },

    platform: {
      type: String,
      default: "",
      trim: true,
    },

    timestamp: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      trim: true,
    },

    // Admin fields
    status: {
      type: String,
      enum: [
        "new",
        "Reviewing",
        "Approved",
        "Rejected",
      ],
      default: "new",
    },

   InflunexaUserId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);


// Indexes
influencerRegistrationSchema.index({
  status: 1,
  createdAt: -1,
});

influencerRegistrationSchema.index({
  createdAt: -1,
  _id: -1,
});

influencerRegistrationSchema.index({
  country: 1,
  createdAt: -1,
});

influencerRegistrationSchema.index({
  state: 1,
  createdAt: -1,
});

influencerRegistrationSchema.index({
  city: 1,
  createdAt: -1,
});

influencerRegistrationSchema.index({
  languages: 1,
  createdAt: -1,
});

influencerRegistrationSchema.index({
  exactFollowers: 1,
  createdAt: -1,
});

influencerRegistrationSchema.index({
  platform: 1,
  createdAt: -1,
});

influencerRegistrationSchema.index({
  categories: 1,
  createdAt: -1,
});

influencerRegistrationSchema.index({
  status: 1,
  country: 1,
  createdAt: -1,
});

influencerRegistrationSchema.index({
  status: 1,
  platform: 1,
  createdAt: -1,
});

influencerRegistrationSchema.index({
  fullName: 1,
});


// Text Search
influencerRegistrationSchema.index({
  fullName: "text",
  email: "text",
  phoneNumber: "text",
  country: "text",
  city: "text",
  platform: "text",
  categories: "text",
  instagramUsername: "text",
  youtubeUsername: "text",
});


// AUTOMATIC INFLUENCER CODE
influencerRegistrationSchema.pre("save", async function (next) {
  if (!this.isNew || this.InflunexaUserId) {
    return next();
  }

  const lastInfluencer = await this.constructor
    .findOne({
      InflunexaUserId: { $regex: /^\d+$/ },
    })
    .sort({ InflunexaUserId: -1 })
    .select("InflunexaUserId")
    .lean();

  let nextCode = 100001;

  if (lastInfluencer?.InflunexaUserId) {
    const lastCode = Number(
      lastInfluencer.InflunexaUserId
    );

    if (Number.isFinite(lastCode)) {
      nextCode = lastCode + 1;
    }
  }

  this.InflunexaUserId = String(nextCode);

  next();
});


export default mongoose.model(
  "InfluencerRegistration",
  influencerRegistrationSchema
);