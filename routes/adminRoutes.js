const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const ctrl = require('../controllers/adminController');
const Event = require('../models/Event');
const Transaction = require('../models/Transaction');

// Users management
router.get('/users', auth, admin, ctrl.listUsers);
router.get('/users/:id', auth, admin, ctrl.getUser);
router.put('/users/:id/status', auth, admin, ctrl.updateStatus);
router.put('/users/:id/limits', auth, admin, ctrl.updateLimits);

// Transactions
router.get('/transactions', auth, admin, ctrl.listTransactions);
router.put('/transactions/:id/status', auth, admin, ctrl.updateTransactionStatus);
router.post('/account/credit', auth, admin, ctrl.creditAccount);

// Pending list and approve endpoints
router.get('/pending', auth, admin, async (req, res) => {
  const tx = await Transaction.find({ status: 'pending' });
  res.json({ success: true, data: tx });
});
router.post('/pending/:id', auth, admin, async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx) return res.status(404).json({ success: false, message: 'Not found' });
  tx.status = 'completed';
  await tx.save();
  res.json({ success: true, data: tx });
});

// Admin sports endpoints
router.post('/sports', auth, admin, async (req, res) => {
  const ev = await Event.create(req.body);
  res.status(201).json({ success: true, data: ev });
});

router.put('/events', auth, admin, async (req, res) => {
  const ev = await Event.findByIdAndUpdate(req.body._id, req.body, { new: true });
  res.json({ success: true, data: ev });
});

// DELETE /admin/markets : expects { eventId, marketId }
router.delete('/markets', auth, admin, async (req, res) => {
  const { eventId, marketId } = req.body;
  const ev = await Event.findById(eventId);
  if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });
  ev.markets.id(marketId).remove();
  await ev.save();
  res.json({ success: true, data: ev });
});

module.exports = router;
