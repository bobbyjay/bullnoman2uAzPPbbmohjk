const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['deposit', 'withdrawal'],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },

    // 🔥 NEW FIELDS FOR WITHDRAW TRANSACTIONS  
    walletType: {
      type: String,
      enum: ['Trust Wallet', 'PayPal', 'Coinbase', 'Binance', 'Apple Pay', null],
      default: null,
    },

    walletAddress: {
      type: String,
      default: null,
    },

    note: {
      type: String,
      trim: true,
    }
  },
  {
    timestamps: true,
  }
);

// Convert "approved" → "completed"
transactionSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'approved') {
    this.status = 'completed';
  }
  next();
});

// 🔥 Format fields automatically
transactionSchema.virtual('formattedDate').get(function () {
  return this.createdAt.toLocaleDateString();
});

transactionSchema.virtual('displayType').get(function () {
  return this.type === 'withdrawal' ? 'Withdrawal' : 'Deposit';
});

module.exports = mongoose.model('Transaction', transactionSchema);