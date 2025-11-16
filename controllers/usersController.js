const userService = require('../services/userService');
const response = require('../utils/responseHandler');
const axios = require('axios');
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
 * @desc    Get only the authenticated user's profile picture stream URL
 * @access  Private
 */
exports.listProfilePictures = async (req, res) => {
  try {
    const user = await userService.getById(req.user.id);
    if (!user || !user.profilePictureId) {
      return response.error(res, 'Profile picture not found', 404);
    }

    // Return only the authenticated user's stream URL
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
 * @desc    Stream the user's profile image (binary)
 * @access  Public or Private based on your auth rules
 */
exports.streamProfilePicture = async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user || !user.profilePictureId) {
      return response.error(res, 'Profile image not found', 404);
    }

    // Generate a secure Cloudinary URL for streaming
    const cloudinaryUrl = cloudinary.url(user.profilePictureId, {
      secure: true,
      format: 'jpg',
      transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
    });

    // Stream the image through your API
    const imgResponse = await axios.get(cloudinaryUrl, { responseType: 'stream' });

    res.setHeader('Content-Type', imgResponse.headers['content-type']);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    imgResponse.data.pipe(res);
  } catch (err) {
    console.error('❌ Error streaming profile picture:', err.message);
    response.error(res, 'Error streaming profile image', 500);
  }
};
