// builds cors options from env
const origins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

module.exports = {
  origin: function (origin, callback) {
    // allow non-browser tools (no origin)
    if (!origin) return callback(null, true);
    if (origins.length === 0) return callback(null, true);
    if (origins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
};
