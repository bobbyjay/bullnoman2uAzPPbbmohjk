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
      min: [1, 'Amount must be positive'],
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },

    note: {
      type: String,
      trim: true,
    },

    // ✅ Add fields used ONLY when type = withdrawal
    walletType: {
      type: String,
      default: null,
    },

    walletAddress: {
      type: String,
      default: null,
    }
  },
  {
    timestamps: true, // createdAt + updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* ----------------------------------------------------------
   🔹 Automatically set "completed" when approved
---------------------------------------------------------- */
transactionSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'approved') {
    this.status = 'completed';
  }
  next();
});

/* ----------------------------------------------------------
   🔹 Virtual: Human readable type for frontend
---------------------------------------------------------- */
transactionSchema.virtual('displayType').get(function () {
  if (this.type === 'deposit') return 'Deposit';
  if (this.type === 'withdrawal') return 'Withdrawal';
  return this.type;
});

/* ----------------------------------------------------------
   🔹 Virtual: Frontend-friendly date (MM/DD/YYYY)
---------------------------------------------------------- */
transactionSchema.virtual('formattedDate').get(function () {
  return this.createdAt
    ? this.createdAt.toLocaleDateString('en-US')
    : '';
});

module.exports = mongoose.model('Transaction', transactionSchema);