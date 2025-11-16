const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/winnerController');
const auth = require('../middlewares/authMiddleware');

/**
 * @route   GET /winners/recent
 * @desc    Get the most recent winners
 * @access  Public
 */
router.get('/recent', ctrl.recent);

/**
 * @route   GET /winners/top
 * @desc    Get top winners
 * @access  Public
 */
router.get('/top', ctrl.top);

/**
 * @route   POST /winners
 * @desc    Add a new winner (Admin only)
 * @access  Private (Admin)
 * @body    { username, prize, imageUrl?, rank? }
 */
router.post('/', auth, ctrl.addWinner);

module.exports = router;
