const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const response = require('../utils/responseHandler');

/* ========================================================
   GET BALANCE
======================================================== */
exports.getBalance = async (req, res) => {
  response.success(res, { balance: req.user.balance });
};

/* ========================================================
   CREATE DEPOSIT REQUEST
======================================================== */
exports.requestDeposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const num = Number(amount);
    if (!num || num <= 0) return response.error(res, 'Invalid amount', 400);

    const adminAccount = await Account.findOne({ isAdmin: true });
    if (!adminAccount) {
      return response.error(
        res,
        'Connection problem — admin account not found. Please contact support.',
        503
      );
    }

    // Create transaction
    const tx = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount: num,
      status: 'pending'
    });

    const adminDetails = {
      bankName: adminAccount.bankName || 'N/A',
      accountName: adminAccount.accountName || 'N/A',
      accountNumber: adminAccount.accountNumber || 'N/A',
      walletAddress: adminAccount.walletAddress || null,
      instructions: 'Please make payment to the above details and await confirmation.'
    };

    response.success(
      res,
      {
        message: 'Deposit request submitted for admin approval.',
        adminDetails,
        transaction: tx
      },
      'Deposit request submitted for admin approval',
      201
    );
  } catch (err) {
    console.error('❌ Deposit request error:', err);
    response.error(res, 'Unable to process deposit request', 500);
  }
};

/* ========================================================
   CREATE WITHDRAW REQUEST
======================================================== */
exports.requestWithdraw = async (req, res) => {
  try {
    const { amount, walletType, walletAddress } = req.body;

    if (!amount || amount <= 0)
      return response.error(res, 'Invalid withdrawal amount', 400);

    if (!walletType || !walletAddress)
      return response.error(res, 'Wallet type and address required', 400);

    // Create Withdrawal entry
    const withdrawReq = await Withdrawal.create({
      user: req.user._id,
      amount,
      walletType,
      walletAddress,
      status: 'pending'
    });

    // Create unified Transaction entry
    const tx = await Transaction.create({
      user: req.user._id,
      type: 'withdrawal',
      amount,
      status: 'pending',
      walletType,
      walletAddress
    });

    response.success(
      res,
      {
        message: 'Withdrawal request submitted and pending admin approval.',
        withdrawal: withdrawReq,
        transaction: tx
      },
      'Withdrawal request created',
      201
    );
  } catch (err) {
    console.error('❌ Withdrawal request error:', err);
    response.error(res, 'Unable to process withdrawal request', 500);
  }
};

/* ========================================================
   GET ALL TRANSACTIONS (FORMATTED FOR FRONTEND)
======================================================== */
exports.listTransactions = async (req, res) => {
  try {
    const list = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    // --- Clean formatted version for UI ---
    const formatted = list.map(tx => ({
      id: tx._id,
      type: tx.displayType,           // Deposit / Withdrawal
      amount: tx.amount,
      status: tx.status,
      date: tx.formattedDate,         // MM/DD/YYYY
      walletType: tx.walletType || null,
      walletAddress: tx.walletAddress || null
    }));

    response.success(res, formatted);
  } catch (err) {
    console.error('❌ Error fetching transactions:', err);
    response.error(res, 'Unable to retrieve transactions', 500);
  }
};

/* ========================================================
   ADMIN — LIST PENDING REQUESTS
======================================================== */
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

/* ========================================================
   ADMIN — APPROVE TRANSACTION
======================================================== */
exports.approveTransaction = async (req, res) => {
  try {
    if (!req.user.isAdmin) return response.error(res, 'Unauthorized', 403);

    const tx = await Transaction.findById(req.params.id).populate('user');
    if (!tx) return response.error(res, 'Transaction not found', 404);
    if (tx.status !== 'pending')
      return response.error(res, 'Transaction already processed', 400);

    if (tx.type === 'deposit') {
      tx.user.balance += tx.amount;
    } 
    else if (tx.type === 'withdrawal') {
      if (tx.user.balance < tx.amount)
        return response.error(res, 'User has insufficient balance', 400);

      tx.user.balance -= tx.amount;

      // Update withdrawal model
      await Withdrawal.findOneAndUpdate(
        { user: tx.user._id, amount: tx.amount, status: 'pending' },
        { status: 'approved' }
      );
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

/* ========================================================
   ADMIN — REJECT TRANSACTION
======================================================== */
exports.rejectTransaction = async (req, res) => {
  try {
    if (!req.user.isAdmin) return response.error(res, 'Unauthorized', 403);

    const tx = await Transaction.findById(req.params.id);
    if (!tx) return response.error(res, 'Transaction not found', 404);
    if (tx.status !== 'pending')
      return response.error(res, 'Transaction already processed', 400);

    tx.status = 'rejected';
    await tx.save();

    if (tx.type === 'withdrawal') {
      await Withdrawal.findOneAndUpdate(
        { user: tx.user, amount: tx.amount, status: 'pending' },
        { status: 'rejected' }
      );
    }

    response.success(res, tx, 'Transaction rejected');
  } catch (err) {
    console.error('❌ Reject transaction error:', err);
    response.error(res, 'Unable to reject transaction', 500);
  }
};