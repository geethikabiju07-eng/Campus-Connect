import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const port = process.env.PORT || 5000;

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error("Missing MONGODB_URI or JWT_SECRET. Configure server/.env.");
  process.exit(1);
}
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "CampusConnect API" }));
app.use("/api/auth", authRoutes);
app.use("/api/events", (req, _res, next) => {
  // Optional auth allows public event responses to include isRegistered when a token is supplied.
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  return requireAuth(req, _res, next);
}, eventRoutes);

app.use((req, res) => res.status(404).json({ message: "API endpoint not found." }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.code === 11000) return res.status(409).json({ message: "That value is already in use." });
  if (error?.name === "ValidationError") return res.status(400).json({ message: "Please check the submitted information." });
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`CampusConnect API listening on port ${port}`)))
  .catch(error => { console.error("MongoDB connection failed:", error.message); process.exit(1); });
