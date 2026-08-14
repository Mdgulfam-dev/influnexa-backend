import mongoose from "mongoose";

const csvCreatorSchema = new mongoose.Schema(
  {
    timestamp: {
      type: String,
      default: "",
    },

    instagramUsername: {
      type: String,
      default: "",
      index: true,
      sparse: true,
    },

    instagramProfileLink: {
      type: String,
      default: "",
    },

    instagramFollowersRange: {
      type: String,
      default: "",
    },

    exactFollowers: {
      type: Number,
      default: 0,
    },

    categories: {
      type: [String],
      default: [],
    },

    phoneNumber: {
      type: String,
      default: "",
      index: true,
      sparse: true,
    },

    whatsappNumber: {
      type: String,
      default: "",
      index: true,
      sparse: true,
    },

    fullName: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: undefined,
      lowercase: true,
      trim: true,
      sparse: true,
      index: true,
    },

    gender: {
      type: String,
      default: "",
    },

    dateOfBirth: {
      type: String,
      default: "",
    },

    influencerType: {
      type: String,
      enum: [
        "Nano Influencer",
        "Micro Influencer",
        "Macro Influencer",
        "Mega Influencer",
      ],
      default: "Nano Influencer",
    },

    campaignType: {
      type: [String],
      default: [],
    },

    whatKindOfDealDoYouParticipateIn: {
      type: String,
      default: "",
    },

    languages: {
      type: [String],
      default: [],
    },

    speakingVideoLink: {
      type: String,
      default: "",
    },

    fullAddress: {
      type: String,
      default: "",
    },

    landmark: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "",
    },

    pincode: {
      type: String,
      default: "",
    },

    photoLink: {
      type: String,
      default: "",
    },

    youtubeUsername: {
      type: String,
      default: "",
      index: true,
      sparse: true,
    },

    youtubeChannelLink: {
      type: String,
      default: "",
    },

    youtubeSubscribersRange: {
      type: String,
      default: "",
    },

    commercialsFor1InstagramReel: {
      type: Number,
      default: 0,
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

    bio: {
      type: String,
      default: "",
    },

    areYouATvMoviesOttCelebrity: {
      type: String,
      default: "",
    },

    typeOfCeleb: {
      type: String,
      default: "",
    },

    whatAllPlatformsAreYouAvailableOn: {
      type: [String],
      default: [],
    },

    howManyAmazonReviewsYouDoPerMonth: {
      type: Number,
      default: 0,
    },

    fetchedFromBrandPage: {
      type: String,
      default: "",
    },

    fetchedForBrand: {
      type: String,
      default: "",
    },

    platform: {
      type: String,
      default: "",
    },

    fetchedDate: {
      type: String,
      default: "",
    },

    InflunexaUserId: {
      type: Number,
      default: 0,
    },

    editStatus: {
      type: String,
      default: "",
    },

    updatedBy: {
      type: String,
      default: "",
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const CsvCreator =
  mongoose.models.CsvCreator ||
  mongoose.model("CsvCreator", csvCreatorSchema);

export default CsvCreator;