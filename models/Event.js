const mongoose = require('mongoose');

const MarketSchema = new mongoose.Schema({
  name: { type: String, required: true },
  odds: { type: Number, required: true },
  meta: { type: Object }
}, { timestamps: false });

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startAt: { type: Date },
  markets: [MarketSchema],
  status: { type: String, enum: ['scheduled', 'live', 'finished', 'cancelled'], default: 'scheduled' },
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
