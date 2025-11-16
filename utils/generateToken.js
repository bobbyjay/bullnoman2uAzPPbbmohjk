const jwt = require('jsonwebtoken');

module.exports = function generateToken(user) {
  const payload = { id: user._id, email: user.email, isAdmin: user.isAdmin };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};
