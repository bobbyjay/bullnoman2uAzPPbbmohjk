// middlewares/ipFirewall.js

const blockedIPs = new Set();
const attempts = new Map();

// Whitelist system (local dev + Render internal IPs)
const SAFE_IPS = [
  "127.0.0.1",
  "::1",
  "localhost",
  "::ffff:127.0.0.1"
];

module.exports = (req, res, next) => {
  let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;

  // Normalize IP (Render sometimes formats it)
  ip = ip.replace("::ffff:", "");

  // Never block safe IPs
  if (SAFE_IPS.includes(ip)) return next();

  // If blocked, deny
  if (blockedIPs.has(ip)) {
    console.warn(`🚫 Blocked IP tried: ${ip}`);
    return res.status(403).json({
      success: false,
      message: "Access denied (Banned IP)"
    });
  }

  // Login protection
  if (req.method === "POST" && req.url.includes("login")) {
    const failCount = attempts.get(ip) || 0;

    attempts.set(ip, failCount + 1);

    if (failCount > 20) {
      blockedIPs.add(ip);
      console.warn(`🔥 Blocked IP due to brute force: ${ip}`);
      return res.status(403).json({
        success: false,
        message: "Too many attempts"
      });
    }
  }

  next();
};