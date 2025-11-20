const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const users = require('../controllers/usersController');

/* -----------------------------------------
   1️⃣ MUST COME FIRST (to avoid route hijack)
------------------------------------------*/
router.get('/me', authMiddleware, users.getMe);

/* -----------------------------------------
   2️⃣ Specific routes
------------------------------------------*/
router.get('/leaderboard', users.leaderboard);

/* -----------------------------------------
   3️⃣ User’s own profile picture (singular)
------------------------------------------*/
router.get('/profile-picture', authMiddleware, async (req, res) => {
  try {
    req.params.id = req.user.id;
    await users.streamProfilePicture(req, res);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error streaming your profile image" });
  }
});

/* -----------------------------------------
   4️⃣ Plural — compatibility
------------------------------------------*/
router.get('/profile-pictures', authMiddleware, users.listProfilePictures);

/* -----------------------------------------
   5️⃣ Specific profile by ID
------------------------------------------*/
router.get('/profile/:id', authMiddleware, users.getProfile);

/* -----------------------------------------
   6️⃣ LAST — dynamic route
------------------------------------------*/
router.get('/:id/profile-picture', users.streamProfilePicture);

module.exports = router;