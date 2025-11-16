const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');
const ctrl = require('../controllers/eventController');

// ✅ GET /events - List all events for users
router.get('/', auth, ctrl.listEvents);

// ✅ GET /events/:id - View single event by ID
router.get('/:id', auth, ctrl.getEvent);

// ✅ POST /events - Create or update (admin only)
router.post('/', auth, admin, ctrl.createOrUpdate);

// ✅ PUT /events - Update existing event (admin only)
router.put('/', auth, admin, ctrl.createOrUpdate);

module.exports = router;
