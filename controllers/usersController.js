const userService = require('../services/userService');
const response = require('../utils/responseHandler');
const { cloudinary } = require('../config/cloudinary');

/**
 * ----------------------------------------------------
 *  🔥 NEW — Needed by frontend (GET /users/me)
 * ----------------------------------------------------
 */
exports.getMe = async (req, res) => {
  try {
    const user = await userService.getById(req.user.id);
    if (!user) return response.error(res, "User not found", 404);

    response.success(res, {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePictureId || null
    });
  } catch (err) {
    console.error("❌ Error in getMe:", err.message);
    response.error(res, "Unable to load user", 500);
  }
};

/**
 * @route   GET /users/profile/:id
 * @desc    Get a user's profile by ID
 */
exports.getProfile = async (req, res) => {
  const user = await userService.getById(req.params.id);
  if (!user) return response.error(res, 'User not found', 404);

  response.success(res, {
    id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePictureId || null
  });
};

/**
 * @route   GET /users/profile-pictures
 * @desc    Get ONLY the authenticated user's profile picture stream URL
 */
exports.listProfilePictures = async (req, res) => {
  try {
    const user = await userService.getById(req.user.id);
    if (!user || !user.profilePictureId) {
      return response.error(res, 'Profile picture not found', 404);
    }

    // stream url must always match:
    // /api/users/:id/profile-picture
    const data = [
      {
        id: user._id,
        username: user.username,
        streamUrl: `/api/users/${user._id}/profile-picture`,
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
 * @desc    Stream user's profile picture via Cloudinary redirect
 */
exports.streamProfilePicture = async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);

    if (!user || !user.profilePictureId) {
      return response.error(res, 'Profile image not found', 404);
    }

    // Build Cloudinary transformed URL
    const cloudinaryUrl = cloudinary.url(user.profilePictureId, {
      secure: true,
      format: "jpg",
      transformation: [
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    });

    // Disable caching ensures updated profile images load immediately
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.redirect(cloudinaryUrl);

  } catch (err) {
    console.error('❌ Error streaming profile picture:', err.message);
    response.error(res, 'Error streaming profile image', 500);
  }
};