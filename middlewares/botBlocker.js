// middlewares/botBlocker.js

module.exports = (req, res, next) => {
  const ua = (req.headers["user-agent"] || "").toLowerCase();

  // Allowed UAs for browsers & Axios web apps
  const safePatterns = ["mozilla", "chrome", "safari", "firefox", "edge"];

  // Only block if UA matches classic bot/crawler patterns
  const botPatterns = [
    "curl", "wget", "python", "scrapy",
    "spider", "crawler", "go-http", "node-fetch"
  ];

  // ⚠ DO NOT BLOCK "axios" → Browsers do NOT send this anyway
  if (!safePatterns.some((p) => ua.includes(p))) {
    if (botPatterns.some((p) => ua.includes(p))) {
      console.warn(`🤖 Blocked bot UA: ${ua}`);
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
  }

  // Payload protection
  const rawBody = JSON.stringify(req.body || "").toLowerCase();

  const payloadDanger = ["<script", "$ne", "$gt", "$lt", "drop table", "or 1=1"];

  if (payloadDanger.some((d) => rawBody.includes(d))) {
    console.warn("🚨 Suspicious payload blocked:", rawBody);
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  next();
};