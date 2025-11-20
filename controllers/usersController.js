const userService = require('../services/userService');
const response = require('../utils/responseHandler');
const { cloudinary } = require('../config/cloudinary');

/**
 * @route   GET /users/profile/:id
 * @desc    Get a user's profile by ID
 */
exports.getProfile = async (req, res) => {
  const user = await userService.getById(req.params.id);
  if (!user) return response.error(res, 'User not found', 404);
  response.success(res, user);
};

/**
 * @route   GET /users/profile-pictures
 * @desc    Get ONLY the authenticated user's profile picture stream URL
 * @access  Private
 */
exports.listProfilePictures = async (req, res) => {
  try {
    const user = await userService.getById(req.user.id);
    if (!user || !user.profilePictureId) {
      return response.error(res, 'Profile picture not found', 404);
    }

    // 🔥 FIX: Provide correct streaming URL for frontend avatar
    const data = [
      {
        id: user._id,
        username: user.username,
        streamUrl: `/api/users/${user._id}/profile-picture`, // frontend now receives correct link
      },
    ];

    response.success(res, data);
  } catch (err) {
    console.error('❌ Error fetching profile picture:', err.message);
    response.error(res, 'Unable to fetch profile picture', 500);
  }
};

/**
 * @route   GET /users/leaderboard
 * @desc    Get leaderboard of top users
 */
exports.leaderboard = async (req, res) => {
  const top = await userService.leaderboard();
  response.success(res, top);
};

/**
 * @route   GET /users/:id/profile-picture
 * @desc    Stream user's profile picture
 * @access  Public or Private depending on setup
 */
exports.streamProfilePicture = async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user || !user.profilePictureId) {
      return response.error(res, 'Profile image not found', 404);
    }

    // 🔥 FIX: Generate optimized Cloudinary URL
    const cloudinaryUrl = cloudinary.url(user.profilePictureId, {
      secure: true,
      format: 'jpg',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // 🔥 FIX: Disable caching so new image always loads
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // 🔥 FIX: Fastest, safest method -> redirect Cloudinary to browser
    return res.redirect(cloudinaryUrl);

  } catch (err) {
    console.error('❌ Error streaming profile picture:', err.message);
    response.error(res, 'Error streaming profile image', 500);
  }
};