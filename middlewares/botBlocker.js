// middlewares/botBlocker.js

module.exports = function botBlocker(req, res, next) {
  const ua = req.headers["user-agent"]?.toLowerCase() || "";

  const blockedAgents = [
    "curl",
    "wget",
    "python",
    "python-requests",
    "axios",
    "scraper",
    "bot"
  ];

  if (blockedAgents.some(agent => ua.includes(agent))) {
    console.warn("🛑 BOT BLOCKED:", ua);
    return res.status(403).json({
      success: false,
      message: "Forbidden"
    });
  }

  next();
};