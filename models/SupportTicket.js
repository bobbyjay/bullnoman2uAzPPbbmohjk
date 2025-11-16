const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['user', 'admin'], required: true }, // ✅ identify who sent it
  message: { type: String },
  imageUrl: { type: String }, // ✅ optional screenshot or attachment
  sentAt: { type: Date, default: Date.now },
});

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    messages: [messageSchema],
    status: {
      type: String,
      enum: ['open', 'closed', 'pending', 'waiting', 'answered'],
      default: 'open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
