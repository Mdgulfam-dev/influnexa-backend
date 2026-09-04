import express from "express";
import BrandRegistration from "../models/BrandRegistration.js";
import InfluencerRegistration from "../models/InfluencerRegistration.js";

const router = express.Router();

const requiredBrandFields = [
  "fullName",
  "email",
  "companyName",
  "country",
  "industry",
  "productName",
  "campaignGoals",
  "targetAudience",
  "budgetRange",
];

const requiredInfluencerFields = [
   // Step 1 - Basic Details
  "fullName",
  "email",
  "phoneNumber",
  "dateOfBirth",

  // Step 2 - Address
  "fullAddress",
  "city",
  "state",
  "pincode",
  "country",

  // Step 3 - Profile
  "categories",
   "engagementRate",
  "audienceCountry",
  "pastWorkWithBrands",


  // Step 4 - Platforms
  "whatAllPlatformsAreYouAvailableOn",

  // Step 5 - Deals
  "campaignType",
];

function missingFields(body, fields) {
  return fields.filter((field) => {
    const value = body[field];

    if (value === undefined || value === null) {
      return true;
    }

    if (typeof value === "string") {
      return value.trim() === "";
    }

    return false;
  });
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeProfile(value) {
  return normalizeText(value).replace(/\/+$/, "").toLowerCase();
}

function normalizeLanguageTags(value) {
  return normalizeText(value).split(",").map((language) => language.trim().toLowerCase()).filter(Boolean);
}

function parseFollowerCount(value) {
  const match = normalizeText(value).toLowerCase().replace(/,/g, "").match(/([\d.]+)\s*(k|m|million|b|billion)?/);
  if (!match) return undefined;
  const multiplier = { k: 1_000, m: 1_000_000, million: 1_000_000, b: 1_000_000_000, billion: 1_000_000_000 }[match[2]] || 1;
  return Math.round(Number(match[1]) * multiplier);
}

function exactCaseInsensitive(value) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedValue}$`, "i");
}

function duplicateRegistrationResponse(res, message) {
  return res.status(409).json({ message });
}

router.post("/brands", async (req, res, next) => {
  try {
    const missing = missingFields(req.body, requiredBrandFields);

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Please complete all required brand fields.",
        missing,
      });
    }

    const email = normalizeEmail(req.body.email);
    const companyName = normalizeText(req.body.companyName);
    const existingRegistration = await BrandRegistration.exists({
      $or: [
        { email },
        { companyName: exactCaseInsensitive(companyName) },
      ],
    });

    if (existingRegistration) {
      return duplicateRegistrationResponse(
        res,
        "A brand registration with this email or company name already exists. Please contact our team if you need to update your details."
      );
    }

    const registration = await BrandRegistration.create({
      ...req.body,
      email,
      companyName,
      campaignTypes: normalizeArray(req.body.campaignTypes),
      preferredPlatforms: normalizeArray(req.body.preferredPlatforms),
    });

    return res.status(201).json({
      message: "Brand registration saved successfully.",
      id: registration._id,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return duplicateRegistrationResponse(res, "A brand registration with this email already exists.");
    }

    return next(error);
  }
});

router.post("/influencers", async (req, res, next) => {
  try {
    const body = req.body || {};

    const missing = missingFields(
      body,
      requiredInfluencerFields
    );

    if (body.consentToContact !== true) {
      if (!missing.includes("consentToContact")) {
        missing.push("consentToContact");
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        message:
          "Please complete all required influencer fields.",
        missing,
      });
    }

    const email = normalizeEmail(body.email);

    const existingRegistration =
      await InfluencerRegistration.exists({
        email,
      });

    if (existingRegistration) {
      return duplicateRegistrationResponse(
        res,
        "An influencer profile with this email already exists. Please contact our team if you need to update your details."
      );
    }

    const toNumber = (value) => {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        return 0;
      }

      const number = Number(value);

      return Number.isFinite(number)
        ? number
        : 0;
    };

    const registration =
      await InfluencerRegistration.create({

        // =====================================
        // BASIC INFORMATION
        // =====================================
        fullName: normalizeText(body.fullName),

        instagramUsername:
          normalizeText(body.instagramUsername),

        instagramProfileLink:
          normalizeText(body.instagramProfileLink),

        instagramFollowersRange:
          normalizeText(
            body.instagramFollowersRange
          ),

        exactFollowers:
          toNumber(body.exactFollowers),

        // =====================================
        // CONTACT
        // =====================================
        phoneNumber:
          normalizeText(body.phoneNumber),

        whatsappNumber:
          normalizeText(body.whatsappNumber),

        email,

        // =====================================
        // CATEGORIES
        // =====================================
        categories:
          normalizeArray(body.categories),
engagementRate:
  normalizeText(body.engagementRate),
        campaignType:
          normalizeArray(body.campaignType),

        influencerType:
          normalizeText(body.influencerType),

        // =====================================
        // PERSONAL
        // =====================================
        gender:
          normalizeText(body.gender),

        dateOfBirth:
          normalizeText(body.dateOfBirth),

        languages:
          normalizeArray(body.languages),
audienceCountry:
  normalizeText(body.audienceCountry),

pastWorkWithBrands:
  normalizeText(body.pastWorkWithBrands),
        // =====================================
        // ADDRESS
        // =====================================
        fullAddress:
          normalizeText(body.fullAddress),

        landmark:
          normalizeText(body.landmark),

        city:
          normalizeText(body.city),

        state:
          normalizeText(body.state),

        country:
          normalizeText(body.country),

        pincode:
          normalizeText(body.pincode),

        // =====================================
        // YOUTUBE
        // =====================================
        youtubeUsername:
          normalizeText(body.youtubeUsername),

        youtubeChannelLink:
          normalizeText(
            body.youtubeChannelLink
          ),

        youtubeSubscribersRange:
          normalizeText(
            body.youtubeSubscribersRange
          ),

        // =====================================
        // COMMERCIALS
        // =====================================
        commercialsFor1InstagramReel:
          toNumber(
            body.commercialsFor1InstagramReel
          ),

        photoLink:
          normalizeText(body.photoLink),

        commercialsFor1InstagramStory:
          toNumber(
            body.commercialsFor1InstagramStory
          ),

        commercialsFor1InstagramPost:
          toNumber(
            body.commercialsFor1InstagramPost
          ),

        commercialsFor1DedicatedYouTubeVideo:
          toNumber(
            body.commercialsFor1DedicatedYouTubeVideo
          ),

        commercialsFor1IntegratedYouTubeVideo:
          toNumber(
            body.commercialsFor1IntegratedYouTubeVideo
          ),

        commercialsFor1DedicatedYouTubeShortsVideo:
          toNumber(
            body.commercialsFor1DedicatedYouTubeShortsVideo
          ),

        commercialsFor1IntegratedYouTubeShortsVideo:
          toNumber(
            body.commercialsFor1IntegratedYouTubeShortsVideo
          ),

        // =====================================
        // OTHER INFORMATION
        // =====================================
        whatKindOfDealDoYouParticipateIn:
          normalizeText(
            body.whatKindOfDealDoYouParticipateIn
          ),

        speakingVideoLink:
          normalizeText(
            body.speakingVideoLink
          ),

        areYouATvMoviesOttCelebrity:
          normalizeText(
            body.areYouATvMoviesOttCelebrity
          ),

        whatAllPlatformsAreYouAvailableOn:
          normalizeArray(
            body.whatAllPlatformsAreYouAvailableOn
          ),

        typeOfCeleb:
          normalizeText(body.typeOfCeleb),

        howManyAmazonReviewsYouDoPerMonth:
          toNumber(
            body.howManyAmazonReviewsYouDoPerMonth
          ),

        platform:
          normalizeText(body.platform),

        timestamp:
          normalizeText(body.timestamp),

        bio:
          normalizeText(body.bio),

        consentToContact:
          body.consentToContact === true,
      });

    return res.status(201).json({
      message:
        "Influencer registration saved successfully.",
      id: registration._id,
    });

  } catch (error) {

    console.error(
      "Influencer registration error:",
      error
    );

    if (error?.code === 11000) {
      return duplicateRegistrationResponse(
        res,
        "An influencer profile with this email already exists."
      );
    }

    return next(error);
  }
});

export default router;
