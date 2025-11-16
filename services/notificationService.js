const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Create a notification for a user
 */
exports.createNotification = async (userId, title, message, type = 'info') => {
  try {
    const notif = await Notification.create({ user: userId, title, message, type });
    logger.info(`Notification created for user ${userId}: ${title}`);
    return notif;
  } catch (err) {
    logger.error('Error creating notification:', err);
    throw new Error('Unable to create notification');
  }
};

/**
 * Get all notifications for a user
 */
exports.getUserNotifications = async (userId) => {
  return await Notification.find({ user: userId }).sort({ createdAt: -1 });
};

/**
 * Mark one notification as read
 */
exports.markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ user: userId, read: false });
};
