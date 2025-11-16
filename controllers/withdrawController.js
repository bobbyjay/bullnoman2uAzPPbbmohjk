const Withdrawal = require('../models/Withdrawal');
const response = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * @route   POST /account/withdraw
 * @desc    Create a new withdrawal request (pending admin approval)
 * @access  Private
 */
exports.requestWithdraw = async (req, res) => {
  try {
    const { amount, walletType, walletAddress } = req.body;

    logger.info(`💸 Withdrawal request received from ${req.user.email}`);

    // ✅ Validate input
    if (!amount || !walletType || !walletAddress) {
      return response.error(res, 'Amount, wallet type, and wallet address are required', 400);
    }

    if (isNaN(amount) || amount <= 0) {
      return response.error(res, 'Invalid withdrawal amount', 400);
    }

    // ✅ Validate allowed wallets
    const allowedWallets = ['Trust Wallet', 'PayPal', 'Coinbase', 'Binance', 'Apple Pay'];
    if (!allowedWallets.includes(walletType)) {
      return response.error(
        res,
        'Only Trust Wallet, PayPal, Coinbase, Binance, or Apple Pay are supported',
        400
      );
    }

    // ✅ Create new withdrawal record
    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      amount,
      walletType,
      walletAddress,
      status: 'pending',
    });

    logger.info(`✅ New withdrawal request created: ${withdrawal._id} (Pending approval)`);

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted and is waiting for admin approval',
      withdrawal,
    });
  } catch (err) {
    logger.error('❌ Error creating withdrawal request:', err);
    return response.error(res, 'Unable to process withdrawal', 500);
  }
};
