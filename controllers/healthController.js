exports.health = async (req, res) => {
  res.json({ success: true, uptime: process.uptime(), env: process.env.NODE_ENV || 'unknown' });
};
