// config/corsOptions.js

const allowedOrigins = [
  "https://clutchden.com",
  "https://www.clutchden.com",
  "https://clutchden.onrender.com",
  "https://a-q7-m9x-l2-k8-zp-4-hn-e5-r6d-yb-3w-pi.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

module.exports = {
  origin: function (origin, callback) {
    // Allow server-to-server or tools (no browser origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn("❌ BLOCKED CORS origin:", origin);
      return callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: "GET,POST,PUT,PATCH,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
};
