import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import paymentRoutes from "./routes/payments.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: clientUrl }));
app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "BlueCode OS PayU API" }));
app.use("/api/payments", paymentRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err.message);
  res.status(500).json({ message: "Internal server error." });
});

try {
  if (!process.env.MONGODB_URI) {
    console.warn("⚠️  MONGODB_URI not set. Running with in-memory store.");
  } else {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
      console.log("✓ MongoDB connected successfully");
    } catch (dbErr) {
      console.warn(`⚠️  MongoDB connection failed: ${dbErr.message}`);
      console.warn("ℹ️  Running server with in-memory fallback store for local development/testing.");
    }
  }
  app.listen(port, () => console.log(`✓ BlueCode OS PayU API listening on http://localhost:${port}`));
} catch (error) {
  console.error("Startup failed:", error.message);
  process.exit(1);
}
