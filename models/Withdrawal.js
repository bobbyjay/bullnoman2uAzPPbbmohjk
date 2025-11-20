const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, 'Amount must be greater than zero'],
    },
    walletType: {
      type: String,
      enum: ['Trust Wallet', 'PayPal', 'Coinbase', 'Binance', 'Apple Pay'],
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true // ✅ adds createdAt and updatedAt automatically
  }
);

// Optional: for consistency with deposits
withdrawalSchema.virtual('created_on').get(function () {
  return this.createdAt;
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);