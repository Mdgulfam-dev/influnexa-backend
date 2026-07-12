import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./config/db.js";
import adminRouter from "./routes/admin.js";
import blogsRouter from "./routes/blogs.js";
import registrationsRouter from "./routes/registrations.js";
import testimonialsRouter from "./routes/testimonials.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
const clientOrigins = (process.env.CLIENT_ORIGIN || "http://127.0.0.1:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const localClientPattern = /^https?:\/\/(127\.0\.0\.1|localhost):\d+$/;
const vercelClientPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

function isAllowedOrigin(origin) {
  return (
    !origin ||
    clientOrigins.includes("*") ||
    clientOrigins.includes(origin) ||
    localClientPattern.test(origin) ||
    vercelClientPattern.test(origin)
  );
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "influnexa-backend" });
});

app.use("/api/registrations", registrationsRouter);
app.use("/api/blogs", blogsRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/admin", adminRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: "Something went wrong while processing the request.",
  });
});

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Influnexa API running on http://127.0.0.1:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
