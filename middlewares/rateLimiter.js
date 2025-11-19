// middlewares/rateLimiter.js
const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 60 * 1000,  // 1 min
  max: 40,              // limit per IP
  message: {
    success: false,
    message: "Too many requests. Slow down."
  },
  standardHeaders: true,
  legacyHeaders: false,
});