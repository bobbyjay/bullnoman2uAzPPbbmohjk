const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/betController');

// POST /bets
router.post('/', auth, ctrl.placeBet);

// GET /bets
router.get('/', ctrl.listBets);

// GET /bets/me
router.get('/me', auth, ctrl.userBets);

module.exports = router;
