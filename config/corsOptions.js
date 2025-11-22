// config/corsOptions.js

const allowedOrigins = [
  "https://clutchden.com",
  "https://www.clutchden.com",
"https://clutch-l7syd5at4-cornellis-projects.vercel.app",
  "https://clutchden-on.netlify.app",
  "https://clutchden.onrender.com",
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
