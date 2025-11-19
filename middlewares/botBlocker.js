// middlewares/botBlocker.js

module.exports = (req, res, next) => {
  const ua = (req.headers['user-agent'] || "").toLowerCase();

  const botPatterns = [
    "curl", "wget", "python", "scrapy", "bot", "spider", "crawler",
    "axios", "go-http", "node-fetch"
  ];

  if (botPatterns.some(p => ua.includes(p))) {
    console.warn(`🤖 Blocked bot UA: ${ua}`);
    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  }

  // Block suspicious payloads
  const rawBody = JSON.stringify(req.body);

  const payloadDanger = ["<script", "$ne", "$gt", "$lt", "drop table", "OR 1=1"];

  if (payloadDanger.some(d => rawBody.toLowerCase().includes(d))) {
    console.warn("🚨 Suspicious payload blocked:", rawBody);
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  next();
};