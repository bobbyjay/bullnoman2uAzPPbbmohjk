const SupportTicket = require('../models/SupportTicket');

exports.createTicket = async ({ userId, subject, message }) => {
  return SupportTicket.create({ user: userId, subject, messages: [{ from: userId, body: message }] });
};

exports.addMessage = async (ticketId, from, body) => {
  const t = await SupportTicket.findById(ticketId);
  t.messages.push({ from, body });
  await t.save();
  return t;
};
