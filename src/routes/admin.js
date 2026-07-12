import express from "express";
import AdminUser, { createSessionToken, hashToken } from "../models/AdminUser.js";
import BlogPost from "../models/BlogPost.js";
import BrandRegistration from "../models/BrandRegistration.js";
import InfluencerRegistration from "../models/InfluencerRegistration.js";
import Testimonial from "../models/Testimonial.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

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
    const [brands, influencers, blogs, testimonials, users] = await Promise.all([
      BrandRegistration.find().sort({ createdAt: -1 }).limit(200),
      InfluencerRegistration.find().sort({ createdAt: -1 }).limit(200),
      BlogPost.find().sort({ publishedAt: -1, createdAt: -1 }).limit(200),
      Testimonial.find().sort({ createdAt: -1 }).limit(200),
      AdminUser.find().sort({ createdAt: -1 }).limit(200),
    ]);

    res.json({
      stats: {
        brands: brands.length,
        influencers: influencers.length,
        blogs: blogs.length,
        testimonials: testimonials.length,
        users: users.length,
        newBrands: brands.filter((brand) => brand.status === "new").length,
        newInfluencers: influencers.filter((influencer) => influencer.status === "new").length,
        publishedBlogs: blogs.filter((blog) => blog.status === "published").length,
        pendingTestimonials: testimonials.filter((testimonial) => testimonial.status === "pending").length,
      },
      brands,
      influencers,
      blogs,
      testimonials,
      users: users.map(publicUser),
      currentUser: req.adminUser?._id ? publicUser(req.adminUser) : req.adminUser,
    });
  } catch (error) {
    next(error);
  }
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

    Object.assign(user, update);

    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters." });
      }
      user.setPassword(req.body.password);
      user.sessionTokenHash = undefined;
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
