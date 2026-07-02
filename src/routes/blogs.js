import express from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import BlogPost from "../models/BlogPost.js";

const router = express.Router();

function createSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

router.get("/", async (req, res, next) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};
    const posts = await BlogPost.find(query).sort({ publishedAt: -1, createdAt: -1 });
    res.json({ posts });
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      status: "published",
    });

    if (!post) {
      return res.status(404).json({ message: "Blog post not found." });
    }

    res.json({ post });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { title, category, excerpt } = req.body;

    if (!title || !category || !excerpt) {
      return res.status(400).json({
        message: "Title, category, and excerpt are required.",
      });
    }

    const slug = req.body.slug || createSlug(title);
    const post = await BlogPost.create({
      ...req.body,
      slug,
      publishedAt: req.body.publishedAt || new Date(),
    });

    res.status(201).json({
      message: "Blog post created successfully.",
      post,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A blog post with this slug already exists." });
    }

    next(error);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const update = { ...req.body };

    if (req.body.title && !req.body.slug) {
      update.slug = createSlug(req.body.title);
    }

    const post = await BlogPost.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!post) {
      return res.status(404).json({ message: "Blog post not found." });
    }

    res.json({
      message: "Blog post updated successfully.",
      post,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A blog post with this slug already exists." });
    }

    next(error);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Blog post not found." });
    }

    res.json({ message: "Blog post deleted successfully." });
  } catch (error) {
    next(error);
  }
});

export default router;
