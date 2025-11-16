const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  market: { type: Object, required: true },
  stake: { type: Number, required: true },
  potentialWin: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'won', 'lost', 'cancelled'], default: 'pending' },
  placedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bet', BetSchema);
