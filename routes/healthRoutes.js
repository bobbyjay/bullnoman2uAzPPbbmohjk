const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/healthController');

router.get('/health', ctrl.health);

module.exports = router;
