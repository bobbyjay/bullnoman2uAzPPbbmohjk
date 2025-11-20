// middlewares/rateLimiter.js

const rateLimit = require("express-rate-limit");

/* ------------------------------------------------------------------
   🟢 SAFE SOURCES (never rate-limit)
   Render servers, localhost, your own frontend.
------------------------------------------------------------------ */
const SAFE_IP_PATTERNS = [
  /^127\./,          // localhost
  /^10\./,           // Render private routing IPs
  /^100\./,          // Render internal infra
  /^172\.1[6-9]\./,  // Private LAN ranges
  /^172\.2[0-9]\./,
  /^172\.3[0-1]\./,
  /^192\.168\./,     // Local WiFi
  /^::1$/,           // IPv6 localhost
];

const SAFE_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "clutchden.onrender.com",
  "clutchden-frontend.onrender.com"
];

/* ------------------------------------------------------------------
   🔥 Rate Limiter (Adaptive)
------------------------------------------------------------------ */
module.exports = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,              // Increased limit to reduce accidental blocking
  message: {
    success: false,
    message: "Too many requests. Slow down."
  },

  standardHeaders: true,
  legacyHeaders: false,

  /* --------------------------------------------------------------
     🧠 CUSTOM KEY GENERATOR (Use client IP safely)
     Prevents Render & internal calls from being rate-limited.
  -------------------------------------------------------------- */
  keyGenerator: (req) => {
    let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
    ip = ip.replace("::ffff:", "");

    // Skip limits for safe IP patterns
    if (SAFE_IP_PATTERNS.some((match) => match.test(ip))) {
      return "safe-ip";
    }

    return ip;
  },

  /* --------------------------------------------------------------
     🧠 SKIP FUNCTION (Full bypass for trusted domains)
  -------------------------------------------------------------- */
  skip: (req) => {
    const hostname = req.hostname?.toLowerCase();

    if (SAFE_HOSTNAMES.includes(hostname)) return true;

    return false;
  }
});