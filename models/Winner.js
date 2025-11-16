const mongoose = require('mongoose');

const WinnerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  bet: { type: mongoose.Schema.Types.ObjectId, ref: 'Bet' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Winner', WinnerSchema);
