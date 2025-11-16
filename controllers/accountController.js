const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const response = require('../utils/responseHandler');

/**
 * GET /account/balance
 * Returns the authenticated user's balance.
 */
exports.getBalance = async (req, res) => {
  response.success(res, { balance: req.user.balance });
};

/**
 * POST /account/deposit
 * Creates a pending deposit request for admin approval.
 * Now includes admin account details if available.
 */
exports.requestDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const num = Number(amount);
    if (!num || num <= 0) return response.error(res, 'Invalid amount', 400);

    // 🔍 Check for admin account details
    const adminAccount = await Account.findOne({ isAdmin: true });
    if (!adminAccount) {
      return response.error(
        res,
        'Connection problem — admin account not found. Please contact support.',
        503
      );
    }

    // 🧾 Create a pending transaction
    const tx = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount: num,
      status: 'pending',
    });

    // 💳 Return admin payment details
    const adminDetails = {
      bankName: adminAccount.bankName || 'N/A',
      accountName: adminAccount.accountName || 'N/A',
      accountNumber: adminAccount.accountNumber || 'N/A',
      walletAddress: adminAccount.walletAddress || null,
      instructions: 'Please make payment to the above details and await confirmation.',
    };

    response.success(
      res,
      {
        message: 'Deposit request submitted for admin approval.',
        adminDetails,
        transaction: tx,
      },
      'Deposit request submitted for admin approval',
      201
    );
  } catch (err) {
    console.error('❌ Deposit request error:', err);
    response.error(res, 'Unable to process deposit request', 500);
  }
};

/**
 * POST /account/withdraw
 * Creates a pending withdrawal request for admin approval.
 */


/**
 * GET /account/transactions
 * Returns all user transactions.
 */
exports.listTransactions = async (req, res) => {
  const tx = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
  response.success(res, tx);
};

/**
 * GET /account/pending
 * Admin: Get all pending deposit/withdrawal requests.
 */
exports.listPendingRequests = async (req, res) => {
  try {
    if (!req.user.isAdmin) return response.error(res, 'Unauthorized', 403);

    const pending = await Transaction.find({ status: 'pending' })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    response.success(res, pending);
  } catch (err) {
    console.error('❌ Error listing pending transactions:', err);
    response.error(res, 'Failed to fetch pending transactions', 500);
  }
};

/**
 * POST /account/approve/:id
 * Admin: Approve a pending transaction and update user balance.
 */
exports.approveTransaction = async (req, res) => {
  try {
    if (!req.user.isAdmin) return response.error(res, 'Unauthorized', 403);

    const tx = await Transaction.findById(req.params.id).populate('user');
    if (!tx) return response.error(res, 'Transaction not found', 404);
    if (tx.status !== 'pending') return response.error(res, 'Transaction already processed', 400);

    if (tx.type === 'deposit') {
      tx.user.balance += tx.amount;
    } else if (tx.type === 'withdrawal') {
      if (tx.user.balance < tx.amount)
        return response.error(res, 'User has insufficient balance', 400);
      tx.user.balance -= tx.amount;
    }

    await tx.user.save();
    tx.status = 'approved';
    await tx.save();

    response.success(res, tx, 'Transaction approved and balance updated');
  } catch (err) {
    console.error('❌ Approve transaction error:', err);
    response.error(res, 'Unable to approve transaction', 500);
  }
};

/**
 * POST /account/reject/:id
 * Admin: Reject a pending transaction without changing balance.
 */
exports.rejectTransaction = async (req, res) => {
  try {
    if (!req.user.isAdmin) return response.error(res, 'Unauthorized', 403);

    const tx = await Transaction.findById(req.params.id);
    if (!tx) return response.error(res, 'Transaction not found', 404);
    if (tx.status !== 'pending') return response.error(res, 'Transaction already processed', 400);

    tx.status = 'rejected';
    await tx.save();

    response.success(res, tx, 'Transaction rejected');
  } catch (err) {
    console.error('❌ Reject transaction error:', err);
    response.error(res, 'Unable to reject transaction', 500);
  }
};
