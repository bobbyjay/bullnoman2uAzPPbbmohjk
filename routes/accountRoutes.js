const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const accountCtrl = require('../controllers/accountController');
const withdrawCtrl = require('../controllers/withdrawController'); // ✅ already imported

// ✅ USER ROUTES

/**
 * @route   GET /account/balance
 * @desc    Get user's account balance
 * @access  Private
 */
router.get('/balance', auth, accountCtrl.getBalance);

/**
 * @route   POST /account/deposit
 * @desc    Create a pending deposit request (requires admin approval)
 * @access  Private
 */
router.post('/deposit', auth, accountCtrl.requestDeposit);

/**
 * @route   POST /account/withdraw
 * @desc    Create a pending withdrawal request (requires admin approval)
 * @access  Private
 */
router.post('/withdraw', auth, withdrawCtrl.requestWithdraw);

/**
 * @route   GET /account/transactions
 * @desc    List user's transactions (approved + pending)
 * @access  Private
 */
router.get('/transactions', auth, accountCtrl.listTransactions);

/**
 * @route   GET /account/withdraw-history
 * @desc    List all user's withdrawals (pending + approved)
 * @access  Private
 */
router.get('/withdraw-history', auth, withdrawCtrl.getUserWithdrawals);  // ✅ NEW ROUTE ADDED

// ✅ ADMIN ROUTES

/**
 * @route   GET /account/pending
 * @desc    List all pending deposit/withdraw requests for approval
 * @access  Admin only
 */
router.get('/pending', auth, accountCtrl.listPendingRequests);

/**
 * @route   POST /account/approve/:id
 * @desc    Approve a pending transaction (deposit or withdraw)
 * @access  Admin only
 */
router.post('/approve/:id', auth, accountCtrl.approveTransaction);

/**
 * @route   POST /account/reject/:id
 * @desc    Reject a pending transaction
 * @access  Admin only
 */
router.post('/reject/:id', auth, accountCtrl.rejectTransaction);

module.exports = router;