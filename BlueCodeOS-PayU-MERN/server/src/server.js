import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import paymentRoutes from "./routes/payments.js";

const app = express();

// Render sets process.env.PORT dynamically. Fallback to 5000 for local development.
const port = Number(process.env.PORT || 5000);

// Parse allowed client origins (supports comma-separated list for multiple environments)
const rawClientUrl = process.env.CLIENT_URL || "";
const configuredOrigins = rawClientUrl
  .split(",")
  .map(url => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const defaultDevOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultDevOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. PayU server-to-server callbacks, mobile apps, curl)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");
    if (
      allowedOrigins.includes(normalizedOrigin) ||
      normalizedOrigin.startsWith("http://localhost:") ||
      normalizedOrigin.startsWith("http://127.0.0.1:") ||
      normalizedOrigin.endsWith(".onrender.com")
    ) {
      return callback(null, true);
    }

    // Allow in development / test environments; in production log notice
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

// Root welcome / status route for immediate Render availability check
app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "BlueCode OS PayU Payment API",
    status: "online",
    environment: process.env.NODE_ENV || "development"
  });
});

// Render Health Check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "BlueCode OS PayU API",
    status: "online",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// PayU Payment routes
app.use("/api/payments", paymentRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err.message);
  res.status(500).json({ message: "Internal server error." });
});

let server;

try {
  // Connect to MongoDB using environment variable
  if (!process.env.MONGODB_URI) {
    console.warn("⚠️  MONGODB_URI not set. Running with in-memory store.");
  } else {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log("✓ MongoDB connected successfully");
    } catch (dbErr) {
      console.warn(`⚠️  MongoDB connection failed: ${dbErr.message}`);
      console.warn("ℹ️  Running server with in-memory fallback store for local development/testing.");
    }
  }

  // Bind to 0.0.0.0 for Render and cloud container routing compatibility
  server = app.listen(port, "0.0.0.0", () => {
    console.log(`✓ BlueCode OS PayU API listening on 0.0.0.0:${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Port ${port} is currently busy. Retrying in 1.5s...`);
      setTimeout(() => {
        server.close();
        server.listen(port, "0.0.0.0");
      }, 1500);
    } else {
      console.error("Server listen error:", err.message);
    }
  });

  // Graceful shutdown handling for Render zero-downtime deploys
  process.on("SIGTERM", async () => {
    console.log("SIGTERM signal received. Closing HTTP server gracefully...");
    if (server) {
      server.close(async () => {
        console.log("HTTP server closed.");
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close(false);
          console.log("MongoDB connection closed.");
        }
        process.exit(0);
      });
    }
  });
} catch (error) {
  console.error("Startup failed:", error.message);
  process.exit(1);
}

export default app;
