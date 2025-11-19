// middlewares/ipFirewall.js

const blockedIPs = new Set();
const attempts = new Map();

module.exports = (req, res, next) => {
  const ip = req.ip;

  // If blocked, instantly deny
  if (blockedIPs.has(ip)) {
    console.warn(`🚫 Blocked IP tried: ${ip}`);
    return res.status(403).json({
      success: false,
      message: "Access denied (Banned IP)"
    });
  }

  // Increment suspicious attempts
  if (req.method === "POST" && req.url.includes("login")) {
    const count = attempts.get(ip) || 0;
    attempts.set(ip, count + 1);

    // Too many failures = block
    if (count > 10) {
      blockedIPs.add(ip);
      console.warn(`🔥 Permanently blocked IP due to brute force: ${ip}`);
    }
  }

  next();
};