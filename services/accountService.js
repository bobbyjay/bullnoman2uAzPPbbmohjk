const Transaction = require('../models/Transaction');
const User = require('../models/User');

exports.createTransaction = async ({ userId, type, amount, meta = {}, status = 'pending' }) => {
  const tx = await Transaction.create({ user: userId, type, amount, status, meta });
  return tx;
};

exports.applyCredit = async ({ userId, amount }) => {
  const user = await User.findById(userId);
  user.balance += amount;
  await user.save();
  const tx = await Transaction.create({ user: userId, type: 'credit', amount, status: 'completed' });
  return { user, tx };
};
