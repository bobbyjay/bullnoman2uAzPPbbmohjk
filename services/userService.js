const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Get user by ID (without password)
 */
exports.getById = async (id) => {
  try {
    const user = await User.findById(id).select('-password');
    return user || null;
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
    return user;
  } catch (err) {
    logger.error('Error updating user profile image:', err);
    throw new Error('Unable to update profile image');
  }
};

/**
 * List all users with minimal profile info + safe stream endpoints
 */
exports.listProfilesWithPictures = async () => {
  try {
    const users = await User.find({
      profilePictureId: { $exists: true, $ne: null },
    }).select('username email profilePictureId _id');

    if (!users || users.length === 0) {
      return [];
    }

    return users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      streamUrl: `/api/users/${user._id.toString()}/profile-picture`,
    }));
  } catch (err) {
    logger.error('Error listing users with pictures:', err);
    throw new Error('Unable to list profile pictures');
  }
};

/**
 * Example leaderboard logic
 */
exports.leaderboard = async () => {
  try {
    const users = await User.find()
      .sort({ totalWins: -1 })
      .limit(10)
      .select('username totalWins profilePictureId');

    return users.map((u) => ({
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
