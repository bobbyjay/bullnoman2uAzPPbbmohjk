const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { upload, handleUploadErrors } = require('../middlewares/uploadMiddleware');
const ctrl = require('../controllers/supportController');

/**
 * @route   POST /support/tickets
 * @desc    Create a new support ticket (with optional image)
 * @access  Private (User)
 */
router.post(
  '/tickets',
  auth,
  ...upload('image'), // ✅ FIXED — spread because upload() returns an array of middlewares
  handleUploadErrors,
  ctrl.createTicket
);

/**
 * @route   GET /support/tickets
 * @desc    Get all tickets for the authenticated user
 * @access  Private (User)
 */
router.get('/tickets', auth, ctrl.listTickets);

/**
 * @route   GET /support/ticket/:id
 * @desc    Get a specific support ticket and its messages
 * @access  Private (User / Admin)
 */
router.get('/ticket/:id', auth, ctrl.getTicket);

/**
 * @route   POST /support/ticket/:id/messages
 * @desc    Send a message in an existing ticket (with optional image)
 * @access  Private (User / Admin)
 */
router.post(
  '/ticket/:id/messages',
  auth,
  ...upload('image'), // ✅ FIXED — allows optional screenshot/image
  handleUploadErrors,
  ctrl.postMessage
);

/**
 * @route   GET /support/admin/tickets
 * @desc    (Optional) Allow admin to view all support tickets
 * @access  Private (Admin only)
 */
router.get('/admin/tickets', auth, ctrl.adminListTickets);

module.exports = router;
