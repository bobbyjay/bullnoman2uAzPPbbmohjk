require("dotenv").config();
require("express-async-errors");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

// Custom middlewares
const rateLimit = require("./middlewares/rateLimiter");
const botBlocker = require("./middlewares/botBlocker");
const ipFirewall = require("./middlewares/ipFirewall");

const { connectDB } = require("./config/db");
const { cloudinaryConfig } = require("./config/cloudinary");
const corsOptions = require("./config/corsOptions");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

/* ------------------------------------------------------------------
   🔥 REQUIRED FOR RENDER (SAFE + COMPATIBLE WITH RATE LIMITING)
------------------------------------------------------------------ */
app.set("trust proxy", "loopback");
// "loopback" = safest option, prevents rate limiting exploit.

/* ------------------------------------------------------------------
   🔌 DATABASE CONNECTION
------------------------------------------------------------------ */
(async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  }
})();

/* ------------------------------------------------------------------
   ☁️ CLOUDINARY
------------------------------------------------------------------ */
try {
  cloudinaryConfig();
  console.log("✅ Cloudinary Ready");
} catch (err) {
  console.error("❌ Cloudinary Error:", err.message);
}

/* ------------------------------------------------------------------
   🛡️ SECURITY + CORE MIDDLEWARE (MUST LOAD BEFORE FIREWALLS)
------------------------------------------------------------------ */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(morgan("combined"));

/* ------------------------------------------------------------------
   🔐 MINI FIREWALL LAYER (SAFE ORDER)
------------------------------------------------------------------ */
app.use("/api/status", (req, res, next) => next()); // Never block health checks

app.use(ipFirewall); // Block dangerous IPs
app.use(botBlocker); // Block scrapers + suspicious UAs

app.use(rateLimit); // Apply rate limiting last

/* ------------------------------------------------------------------
   🧭 ROUTES
------------------------------------------------------------------ */
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/usersRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/account", require("./routes/accountRoutes"));
app.use("/api/bets", require("./routes/betsRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/support", require("./routes/supportRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/winners", require("./routes/winnerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/status", require("./routes/healthRoutes"));

/* ------------------------------------------------------------------
   🏁 ROOT CHECK
------------------------------------------------------------------ */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ClutchDen API running 🚀",
  });
});

/* ------------------------------------------------------------------
   ❌ 404 HANDLER
------------------------------------------------------------------ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

/* ------------------------------------------------------------------
   🚨 GLOBAL ERROR HANDLER
------------------------------------------------------------------ */
app.use(errorHandler);

/* ------------------------------------------------------------------
   🚀 START SERVER
------------------------------------------------------------------ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  process.exit(1);
});