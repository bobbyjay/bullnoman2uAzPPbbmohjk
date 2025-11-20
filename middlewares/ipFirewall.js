// middlewares/ipFirewall.js

const blockedIPs = new Set();
const attempts = new Map();

/* ------------------------------------------------------------------
   ✅ ALLOWED HOSTNAMES / DOMAINS (Frontend & backend)
------------------------------------------------------------------ */
const allowedIPs = [
  "127.0.0.1",
  "localhost",
  "::1",

  // 🔥 YOUR FRONTEND DOMAINS
  "clutchden.onrender.com",
  "clutchden-frontend.onrender.com"
];

/* ------------------------------------------------------------------
   ✅ SAFE IP PATTERNS (Render internal networks + local WiFi)
------------------------------------------------------------------ */
const SAFE_PATTERNS = [
  /^127\./,        // localhost IPv4
  /^10\./,         // Render internal routing IPs
  /^100\./,        // Render private network range
  /^172\.1[6-9]\./,
  /^172\.2[0-9]\./,
  /^172\.3[0-1]\./,
  /^192\.168\./,   // Local WiFi LAN
  /^::1$/,         // IPv6 localhost
];


/* ------------------------------------------------------------------
   🔥 FIREWALL MIDDLEWARE
------------------------------------------------------------------ */
module.exports = (req, res, next) => {
  let ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;

  // Normalize IPv4-mapped IPv6 addresses
  ip = ip.replace("::ffff:", "");

  // If incoming value is a hostname, check allowed list
  const host = req.hostname?.toLowerCase();

  if (allowedIPs.includes(host)) {
    return next();
  }

  // Allow safe internal subnets
  if (SAFE_PATTERNS.some((pattern) => pattern.test(ip))) {
    return next();
  }

  // Blocked previously?
  if (blockedIPs.has(ip)) {
    console.warn(`🚫 Blocked IP attempted: ${ip}`);
    return res.status(403).json({
      success: false,
      message: "Access denied (Banned IP)"
    });
  }

  /* ----------------------------------------
     🛡️ BRUTE FORCE LOGIN PROTECTION
  ---------------------------------------- */
  if (req.method === "POST" && req.url.includes("login")) {
    const count = attempts.get(ip) || 0;
    const updated = count + 1;

    attempts.set(ip, updated);

    console.log(`Login attempt ${updated} from ${ip}`);

    if (updated > 30) {
      blockedIPs.add(ip);
      console.warn(`🔥 IP Banned for brute force: ${ip}`);

      return res.status(403).json({
        success: false,
        message: "Too many failed login attempts"
      });
    }

    // Reset count after 10 minutes
    setTimeout(() => attempts.delete(ip), 10 * 60 * 1000);
  }

  next();
};