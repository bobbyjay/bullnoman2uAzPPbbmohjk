const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const users = require('../controllers/usersController');

/**
 * ----------------------------------------------------
 *  🔥 FIXED: Add /users/me route
 *  Your frontend calls GET /users/me on refresh.
 *  Missing route caused 404 errors.
 * ----------------------------------------------------
 */
router.get('/me', authMiddleware, users.getMe);

/**
 * @route   GET /users/profile/:id
 * @desc    Get a specific user's profile
 * @access  Private
 */
router.get('/profile/:id', authMiddleware, users.getProfile);

/**
 * ----------------------------------------------------
 *  🔥 FIXED: Your frontend uses /users/profile-picture
 *  not /users/profile-pictures (plural)
 *  So we keep both for safety.
 * ----------------------------------------------------
 */

/**
 * OLD (plural) — keep for compatibility
 * @route GET /users/profile-pictures
 */
router.get('/profile-pictures', authMiddleware, users.listProfilePictures);

/**
 * NEW (singular) — matches your frontend api.js
 * @route GET /users/profile-picture
 */
router.get('/profile-picture', authMiddleware, async (req, res) => {
  try {
    req.params.id = req.user.id; 
    await users.streamProfilePicture(req, res);
  } catch (err) {
    console.error('❌ Error streaming authenticated user profile picture:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error streaming your profile image'
    });
  }
});

/**
 * @route   GET /users/:id/profile-picture
 * @desc    Stream ANY user's profile image
 * @access  Public (or private depending on your setup)
 */
router.get('/:id/profile-picture', users.streamProfilePicture);

/**
 * @route   GET /users/leaderboard
 * @desc    Public leaderboard
 * @access  Public
 */
router.get('/leaderboard', users.leaderboard);

module.exports = router;