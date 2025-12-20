const mongoose = require('mongoose');

const WinnerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // winners may be manual/admin
    },

    username: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    prize: {
      type: String,
      default: 'No prize specified',
    },

    rank: {
      type: Number,
    },

    /**
     * ✅ Store ONLY Cloudinary public_id
     * ❌ Never store Cloudinary URLs
     */
    imagePublicId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model('Winner', WinnerSchema);

