import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    category: { type: String, required: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, trim: true },
    author: { type: String, trim: true, default: "Influnexa Team" },
    readTime: { type: String, trim: true, default: "5 min read" },
    coverImage: { type: String, trim: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("BlogPost", blogPostSchema);
