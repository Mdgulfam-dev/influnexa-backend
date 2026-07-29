import express from "express";
import AdminUser, { createSessionToken, hashToken } from "../models/AdminUser.js";
import BlogPost from "../models/BlogPost.js";
import BrandRegistration from "../models/BrandRegistration.js";
import InfluencerRegistration from "../models/InfluencerRegistration.js";
import Testimonial from "../models/Testimonial.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import { sendApplicationStatusEmail } from "../services/sendgrid.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

const MAX_REGISTRATION_PAGE_SIZE = 100;

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function paginationFromQuery(query, prefix) {
  const page = Math.max(Number.parseInt(query[`${prefix}Page`], 10) || 1, 1);
  const requestedLimit = Number.parseInt(query[`${prefix}Limit`], 10) || 25;
  const limit = Math.min(Math.max(requestedLimit, 10), MAX_REGISTRATION_PAGE_SIZE);

  return { limit, page, skip: (page - 1) * limit };
}

function buildSearchFilter(search, fields) {
  const trimmedSearch = String(search || "").trim();

  if (!trimmedSearch) {
    return {};
  }

  const regex = new RegExp(escapeRegex(trimmedSearch), "i");
  return { $or: fields.map((field) => ({ [field]: regex })) };
}

function buildStatusFilter(status, aliases = {}) {
  const trimmedStatus = String(status || "").trim();

  if (!trimmedStatus) {
    return {};
  }

  const statuses = aliases[trimmedStatus] || [trimmedStatus];
  return { status: { $in: statuses } };
}

function pageMeta({ limit, page }, total) {
  return {
    limit,
    page,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function canManageUsers(user) {
  return user?.role === "owner" || user?.role === "admin";
}

router.post("/login", async (req, res, next) => {
  const adminToken = process.env.ADMIN_TOKEN;
  const { email, password } = req.body;

  if (!adminToken) {
    return res.status(500).json({ message: "ADMIN_TOKEN is not configured." });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  try {
    const userCount = await AdminUser.countDocuments();

    if (userCount === 0 && password === adminToken) {
      const bootstrapEmail = (email || process.env.ADMIN_EMAIL || "owner@influnexa.local").toLowerCase();
      const user = new AdminUser({
        name: "Owner",
        email: bootstrapEmail,
        role: "owner",
        status: "active",
      });
      user.setPassword(password);

      const token = createSessionToken();
      user.sessionTokenHash = hashToken(token);
      user.lastLoginAt = new Date();
      await user.save();

      return res.json({
        message: "Login successful.",
        token,
        user: publicUser(user),
      });
    }

    if (!email) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await AdminUser.findOne({ email: email.toLowerCase(), status: "active" });

    if (!user || !user.verifyPassword(password)) {
      return res.status(401).json({
        message:
          userCount === 0
            ? "First admin setup requires the ADMIN_TOKEN password from backend/.env."
            : "Invalid admin credentials. Use an existing admin email and password. ADMIN_TOKEN only creates the first owner when no admin users exist.",
      });
    }

    const token = createSessionToken();
    user.sessionTokenHash = hashToken(token);
    user.lastLoginAt = new Date();
    await user.save();

    return res.json({
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.use(requireAdmin);

router.get("/dashboard", async (req, res, next) => {
  try {
    const brandPage = paginationFromQuery(req.query, "brand");
    const influencerPage = paginationFromQuery(req.query, "influencer");
    const candidatePage = paginationFromQuery(req.query, "candidate");
    const brandFilter = {
      ...buildSearchFilter(req.query.brandSearch, [
        "companyName",
        "contactName",
        "email",
        "phone",
        "country",
        "industry",
        "productName",
      ]),
      ...buildStatusFilter(req.query.brandStatus, {
        New: ["New", "new"],
        Contacted: ["Contacted", "contacted"],
        "Under Review": ["Under Review", "qualified"],
        Closed: ["Closed", "closed"],
      }),
    };
    const influencerFilter = {
      ...buildSearchFilter(req.query.influencerSearch, [
        "creatorName",
        "fullName",
        "email",
        "phone",
        "country",
        "city",
        "primaryPlatform",
        "categories",
      ]),
      ...buildStatusFilter(req.query.influencerStatus),
    };
    const candidateFilter = {
      ...buildSearchFilter(req.query.candidateSearch, ["name", "email", "phone", "jobId", "jobTitle"]),
      ...buildStatusFilter(req.query.candidateStatus),
      ...(String(req.query.candidateJobId || "").trim() ? { jobId: new RegExp(`^${escapeRegex(req.query.candidateJobId.trim())}$`, "i") } : {}),
    };

    const [
      brands,
      brandTotal,
      brandCount,
      newBrandCount,
      influencers,
      influencerTotal,
      influencerCount,
      newInfluencerCount,
      blogs,
      testimonials,
      users,
      jobs,
      applications,
      applicationTotal,
      applicationCount,
    ] = await Promise.all([
      BrandRegistration.find(brandFilter).sort({ createdAt: -1 }).skip(brandPage.skip).limit(brandPage.limit).lean(),
      Object.keys(brandFilter).length ? BrandRegistration.countDocuments(brandFilter) : BrandRegistration.estimatedDocumentCount(),
      BrandRegistration.estimatedDocumentCount(),
      BrandRegistration.countDocuments({ status: { $in: ["New", "new"] } }),
      InfluencerRegistration.find(influencerFilter).sort({ createdAt: -1 }).skip(influencerPage.skip).limit(influencerPage.limit).lean(),
      Object.keys(influencerFilter).length ? InfluencerRegistration.countDocuments(influencerFilter) : InfluencerRegistration.estimatedDocumentCount(),
      InfluencerRegistration.estimatedDocumentCount(),
      InfluencerRegistration.countDocuments({ status: "new" }),
      BlogPost.find().sort({ publishedAt: -1, createdAt: -1 }).limit(200),
      Testimonial.find().sort({ createdAt: -1 }).limit(200),
      AdminUser.find().sort({ createdAt: -1 }).limit(200),
      Job.find().sort({ createdAt: -1 }).lean(),
      JobApplication.find(candidateFilter).sort({ createdAt: -1 }).skip(candidatePage.skip).limit(candidatePage.limit).lean(),
      Object.keys(candidateFilter).length ? JobApplication.countDocuments(candidateFilter) : JobApplication.estimatedDocumentCount(),
      JobApplication.estimatedDocumentCount(),
    ]);

    res.json({
      stats: {
        brands: brandCount,
        influencers: influencerCount,
        blogs: blogs.length,
        testimonials: testimonials.length,
        users: users.length,
        jobs: jobs.length,
        applications: applicationCount,
        reviewApplications: await JobApplication.countDocuments({ status: "Review" }),
        newBrands: newBrandCount,
        newInfluencers: newInfluencerCount,
        publishedBlogs: blogs.filter((blog) => blog.status === "published").length,
        pendingTestimonials: testimonials.filter((testimonial) => testimonial.status === "pending").length,
      },
      pagination: {
        brands: pageMeta(brandPage, brandTotal),
        influencers: pageMeta(influencerPage, influencerTotal),
        applications: pageMeta(candidatePage, applicationTotal),
      },
      brands,
      influencers,
      blogs,
      testimonials,
      users: users.map(publicUser),
      jobs,
      applications,
      currentUser: req.adminUser?._id ? publicUser(req.adminUser) : req.adminUser,
    });
  } catch (error) {
    next(error);
  }
});

function jobPayload(body, { includeJobId = false } = {}) {
  const fields = ["title", "department", "type", "location", "experience", "summary", "description"];
  const missing = fields.filter((field) => !String(body[field] || "").trim());
  if (missing.length) return { error: "Please complete all required job fields." };
  const toArray = (value) => Array.isArray(value) ? value.filter(Boolean) : String(value || "").split("\n").map((item) => item.trim()).filter(Boolean);
  const value = { ...body, responsibilities: toArray(body.responsibilities), requirements: toArray(body.requirements) };
  if (includeJobId) value.jobId = body.jobId.trim().toUpperCase();
  else delete value.jobId;
  return { value };
}

async function nextJobId() {
  const latest = await Job.findOne({ jobId: /^INX-\d{5}$/ }).sort({ jobId: -1 }).select("jobId").lean();
  const lastNumber = Number.parseInt(latest?.jobId?.slice(4) || "0", 10);
  if (lastNumber >= 99999) throw new Error("Job ID limit reached.");
  return `INX-${String(lastNumber + 1).padStart(5, "0")}`;
}

router.post("/jobs", async (req, res, next) => {
  try { const payload = jobPayload(req.body); if (payload.error) return res.status(400).json({ message: payload.error }); let job; for (let attempt = 0; attempt < 3; attempt += 1) { try { job = await Job.create({ ...payload.value, jobId: await nextJobId() }); break; } catch (error) { if (error.code !== 11000 || attempt === 2) throw error; } } return res.status(201).json({ job }); } catch (error) { return next(error); }
});
router.patch("/jobs/:id", async (req, res, next) => {
  try { const payload = jobPayload(req.body); if (payload.error) return res.status(400).json({ message: payload.error }); const job = await Job.findByIdAndUpdate(req.params.id, payload.value, { new: true, runValidators: true }); if (!job) return res.status(404).json({ message: "Job not found." }); return res.json({ job }); } catch (error) { return next(error); }
});
router.delete("/jobs/:id", async (req, res, next) => { try { const job = await Job.findByIdAndDelete(req.params.id); if (!job) return res.status(404).json({ message: "Job not found." }); return res.json({ message: "Job deleted." }); } catch (error) { return next(error); } });
router.patch("/applications/:id/status", async (req, res, next) => {
  try {
    const application = await JobApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found." });

    const statusChanged = application.status !== req.body.status;
    application.status = req.body.status;
    await application.save();

    let email = { sent: false, skipped: true };
    if (statusChanged) {
      try {
        email = await sendApplicationStatusEmail(application);
      } catch (emailError) {
        console.error("Candidate status email failed:", emailError.message);
        email = { sent: false, skipped: false, reason: emailError.message };
      }
    }

    return res.json({ application, email });
  } catch (error) { return next(error); }
});

router.post("/users", async (req, res, next) => {
  if (!canManageUsers(req.adminUser)) {
    return res.status(403).json({ message: "You do not have permission to manage admin users." });
  }

  try {
    const { name, email, password, role = "admin", status = "active" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    if (role === "owner" && req.adminUser?.role !== "owner") {
      return res.status(403).json({ message: "Only the owner can create another owner account." });
    }

    const user = new AdminUser({ name, email, role, status });
    user.setPassword(password);
    await user.save();

    res.status(201).json({
      message: "Admin user created successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An admin user with this email already exists." });
    }

    return next(error);
  }
});

router.patch("/users/me/password", async (req, res, next) => {
  try {
    if (!req.adminUser?._id) {
      return res.status(403).json({ message: "Bootstrap access cannot change a user password." });
    }

    const { currentPassword, password } = req.body;

    if (!currentPassword || !password) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const user = await AdminUser.findById(req.adminUser._id);

    if (!user || user.status !== "active") {
      return res.status(404).json({ message: "Admin user not found." });
    }

    if (!user.verifyPassword(currentPassword)) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.setPassword(password);
    await user.save();

    res.json({
      message: "Password updated successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id", async (req, res, next) => {
  if (!canManageUsers(req.adminUser)) {
    return res.status(403).json({ message: "You do not have permission to manage admin users." });
  }

  try {
    const update = {};
    const allowedFields = ["name", "email", "role", "status"];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    });

    const user = await AdminUser.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Admin user not found." });
    }

    if (user.role === "owner") {
      if (update.role && update.role !== "owner") {
        return res.status(403).json({ message: "Owner access cannot be removed." });
      }

      if (update.status && update.status !== "active") {
        return res.status(403).json({ message: "Owner access cannot be disabled." });
      }
    }

    if (update.role === "owner" && req.adminUser?.role !== "owner") {
      return res.status(403).json({ message: "Only the owner can assign owner access." });
    }

    Object.assign(user, update);

    if (req.body.password) {
      return res.status(403).json({ message: "Users can only change their own password from the password form." });
    }

    await user.save();

    res.json({
      message: "Admin user updated successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An admin user with this email already exists." });
    }

    return next(error);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  if (!canManageUsers(req.adminUser)) {
    return res.status(403).json({ message: "You do not have permission to manage admin users." });
  }

  try {
    if (String(req.adminUser?._id) === req.params.id) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    const user = await AdminUser.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Admin user not found." });
    }

    if (user.role === "owner") {
      return res.status(403).json({ message: "Owner access cannot be deleted." });
    }

    await user.deleteOne();

    res.json({ message: "Admin user deleted successfully." });
  } catch (error) {
    next(error);
  }
});

router.patch("/brands/:id/status", async (req, res, next) => {
  try {
    const brand = await BrandRegistration.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ message: "Brand registration not found." });
    }

    res.json({ message: "Brand status updated.", brand });
  } catch (error) {
    next(error);
  }
});

router.patch("/influencers/:id/status", async (req, res, next) => {
  try {
    const influencer = await InfluencerRegistration.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!influencer) {
      return res.status(404).json({ message: "Influencer registration not found." });
    }

    res.json({ message: "Influencer status updated.", influencer });
  } catch (error) {
    next(error);
  }
});

router.patch("/testimonials/:id/status", async (req, res, next) => {
  try {
    const update = { $set: { status: req.body.status }, $unset: {} };

    if (req.body.status === "approved") {
      update.$set.approvedAt = new Date();
    }

    if (req.body.status !== "approved") {
      update.$unset.approvedAt = "";
    }

    if (Object.keys(update.$unset).length === 0) {
      delete update.$unset;
    }

    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found." });
    }

    res.json({ message: "Testimonial status updated.", testimonial });
  } catch (error) {
    next(error);
  }
});

router.delete("/testimonials/:id", async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found." });
    }

    await testimonial.deleteOne();

    res.json({ message: "Testimonial deleted successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
