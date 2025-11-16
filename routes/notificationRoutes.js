const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/notificationController');

// POST /notifications/devices
router.post('/devices', auth, ctrl.registerDevice);

// GET /notifications
router.get('/', auth, ctrl.getNotifications);

module.exports = router;
