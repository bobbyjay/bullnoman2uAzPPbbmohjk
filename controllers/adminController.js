const User = require('../models/User');
const Transaction = require('../models/Transaction');
const response = require('../utils/responseHandler');

exports.listUsers = async (req, res) => {
  const users = await User.find().select('-password');
  response.success(res, users);
};

exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return response.error(res, 'Not found', 404);
  response.success(res, user);
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = await User.findById(id);
  if (!user) return response.error(res, 'Not found', 404);
  user.disabled = status === 'disabled';
  await user.save();
  response.success(res, user, 'Status updated');
};

exports.updateLimits = async (req, res) => {
  const { id } = req.params;
  const { limits } = req.body;
  const user = await User.findById(id);
  user.limits = { ...user.limits, ...limits };
  await user.save();
  response.success(res, user, 'Limits updated');
};

exports.listTransactions = async (req, res) => {
  const tx = await Transaction.find().sort({ createdAt: -1 });
  response.success(res, tx);
};

exports.updateTransactionStatus = async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  tx.status = req.body.status || tx.status;
  await tx.save();
  response.success(res, tx, 'Updated');
};

exports.creditAccount = async (req, res) => {
  const { userId, amount } = req.body;
  const user = await User.findById(userId);
  user.balance += Number(amount);
  await user.save();
  const tx = await Transaction.create({ user: userId, type: 'credit', amount: Number(amount), status: 'completed' });
  response.success(res, tx, 'Credited');
};
