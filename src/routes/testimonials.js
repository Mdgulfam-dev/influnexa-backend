import express from "express";
import Testimonial from "../models/Testimonial.js";

const router = express.Router();

function publicTestimonial(testimonial) {
  return {
    _id: testimonial._id,
    name: testimonial.name,
    role: testimonial.role,
    quote: testimonial.quote,
    rating: testimonial.rating,
    approvedAt: testimonial.approvedAt,
  };
}

router.get("/", async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ status: "approved" })
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(12);

    res.json({ testimonials: testimonials.map(publicTestimonial) });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, role, email, quote, rating = 5 } = req.body;

    if (!name || !role || !quote) {
      return res.status(400).json({ message: "Name, role, and review are required." });
    }

    const testimonial = await Testimonial.create({
      name,
      role,
      email,
      quote,
      rating,
      status: "pending",
    });

    res.status(201).json({
      message: "Review submitted. It will appear after admin approval.",
      id: testimonial._id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
