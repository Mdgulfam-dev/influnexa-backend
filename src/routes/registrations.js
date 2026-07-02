import express from "express";
import BrandRegistration from "../models/BrandRegistration.js";
import InfluencerRegistration from "../models/InfluencerRegistration.js";

const router = express.Router();

const requiredBrandFields = [
  "contactName",
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
  "fullName",
  "creatorName",
  "email",
  "country",
  "languages",
  "primaryPlatform",
  "primaryProfile",
  "followers",
];

function missingFields(body, fields) {
  return fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === "";
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

router.post("/brands", async (req, res, next) => {
  try {
    const missing = missingFields(req.body, requiredBrandFields);

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Please complete all required brand fields.",
        missing,
      });
    }

    const registration = await BrandRegistration.create({
      ...req.body,
      campaignTypes: normalizeArray(req.body.campaignTypes),
      preferredPlatforms: normalizeArray(req.body.preferredPlatforms),
    });

    return res.status(201).json({
      message: "Brand registration saved successfully.",
      id: registration._id,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/influencers", async (req, res, next) => {
  try {
    const missing = missingFields(req.body, requiredInfluencerFields);

    if (req.body.consentToContact !== true) {
      missing.push("consentToContact");
    }

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Please complete all required influencer fields.",
        missing,
      });
    }

    const registration = await InfluencerRegistration.create({
      ...req.body,
      categories: normalizeArray(req.body.categories),
      contentTypes: normalizeArray(req.body.contentTypes),
    });

    return res.status(201).json({
      message: "Influencer registration saved successfully.",
      id: registration._id,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
