const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get user by ID (without password)
 * Ensures consistent return shape for frontend
 */
exports.getById = async (id) => {
  try {
    const user = await User.findById(id).select('-password');
    if (!user) return null;

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      profilePictureId: user.profilePictureId || null,
    };
  } catch (err) {
    logger.error('Error fetching user by ID:', err);
    return null;
  }
};

/**
 * Update user's profile image ID (Cloudinary public_id)
 */
exports.updateProfileImage = async (userId, profilePictureId) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePictureId },
      { new: true, select: '-password' }
    );

    if (!user) return null;

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      profilePictureId: user.profilePictureId || null,
    };
  } catch (err) {
    logger.error('Error updating user profile image:', err);
    throw new Error('Unable to update profile image');
  }
};

/**
 * List users that have profile pictures
 * Used for gallery / admin views
 */
exports.listProfilesWithPictures = async () => {
  try {
    const users = await User.find({
      profilePictureId: { $exists: true, $ne: null },
    }).select('username email profilePictureId _id');

    return users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      streamUrl: `/api/users/${user._id.toString()}/profile-picture`,
    }));
  } catch (err) {
    logger.error('Error listing users with pictures:', err);
    throw new Error('Unable to list profile pictures');
  }
};

/**
 * Leaderboard
 */
exports.leaderboard = async () => {
  try {
    const users = await User.find()
      .sort({ totalWins: -1 })
      .limit(10)
      .select('username totalWins profilePictureId _id');

    return users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      totalWins: u.totalWins,
      profileImage: u.profilePictureId
        ? `/api/users/${u._id.toString()}/profile-picture`
        : null,
    }));
  } catch (err) {
    logger.error('Error generating leaderboard:', err);
    throw new Error('Unable to load leaderboard');
  }
};