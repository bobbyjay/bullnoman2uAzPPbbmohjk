const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const users = require('../controllers/usersController');

/**
 * @route   GET /users/profile/:id
 * @desc    Get a specific user's profile
 * @access  Private
 */
router.get('/profile/:id', authMiddleware, users.getProfile);

/**
 * @route   GET /users/profile-pictures
 * @desc    Get the authenticated user's profile picture stream URL
 * @access  Private
 */
router.get('/profile-pictures', authMiddleware, users.listProfilePictures);

/**
 * @route   GET /users/leaderboard
 * @desc    Get leaderboard of top users
 * @access  Public
 */
router.get('/leaderboard', users.leaderboard);

/**
 * @route   GET /users/:id/profile-picture
 * @desc    Stream any user's profile image (binary)
 * @access  Public or Private (depending on your setup)
 */
router.get('/:id/profile-picture', users.streamProfilePicture);

/**
 * @route   GET /users/profile-picture
 * @desc    Stream the authenticated user's profile image directly
 * @access  Private
 */
router.get('/profile-picture', authMiddleware, async (req, res) => {
  try {
    // Reuse the same logic from streamProfilePicture
    req.params.id = req.user.id; // inject current user ID
    await users.streamProfilePicture(req, res);
  } catch (err) {
    console.error('❌ Error streaming authenticated user profile picture:', err.message);
    res.status(500).json({ success: false, message: 'Error streaming your profile image' });
  }
});

module.exports = router;
