const notificationService = require('../services/notificationService');
const response = require('../utils/responseHandler');

exports.registerDevice = async (req, res) => {
  response.success(res, { message: 'Device registered (mock)' });
};

exports.getNotifications = async (req, res) => {
  const notifs = await notificationService.getUserNotifications(req.user.id);
  response.success(res, notifs);
};

exports.getUnreadCount = async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  response.success(res, { count });
};

exports.markAsRead = async (req, res) => {
  const notif = await notificationService.markAsRead(req.params.id, req.user.id);
  if (!notif) return response.error(res, 'Notification not found', 404);
  response.success(res, notif);
};

exports.deleteNotification = async (req, res) => {
  const result = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!result) return response.error(res, 'Notification not found', 404);
  response.success(res, { message: 'Notification deleted' });
};
