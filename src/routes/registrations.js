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

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeProfile(value) {
  return normalizeText(value).replace(/\/+$/, "").toLowerCase();
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

    const email = normalizeEmail(req.body.email);
    const primaryProfile = normalizeProfile(req.body.primaryProfile);
    const existingRegistration = await InfluencerRegistration.exists({
      $or: [
        { email },
        { primaryProfile: exactCaseInsensitive(primaryProfile) },
      ],
    });

    if (existingRegistration) {
      return duplicateRegistrationResponse(
        res,
        "An influencer profile with this email or social profile already exists. Please contact our team if you need to update your details."
      );
    }

    const registration = await InfluencerRegistration.create({
      ...req.body,
      email,
      primaryProfile,
      categories: normalizeArray(req.body.categories),
      contentTypes: normalizeArray(req.body.contentTypes),
    });

    return res.status(201).json({
      message: "Influencer registration saved successfully.",
      id: registration._id,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return duplicateRegistrationResponse(res, "An influencer profile with this email or social profile already exists.");
    }

    return next(error);
  }
});

export default router;
