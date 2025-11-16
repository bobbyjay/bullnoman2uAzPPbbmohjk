const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.listUsers = async () => User.find().select('-password');
exports.getUser = async id => User.findById(id).select('-password');
exports.updateUserStatus = async (id, disabled) => {
  const u = await User.findById(id);
  u.disabled = disabled;
  await u.save();
  return u;
};
exports.updateLimits = async (id, limits) => {
  const u = await User.findById(id);
  u.limits = { ...u.limits, ...limits };
  await u.save();
  return u;
};
