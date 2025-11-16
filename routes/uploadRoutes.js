const express = require('express');
const router = express.Router();

const { upload, handleUploadErrors } = require('../middlewares/uploadMiddleware');
const auth = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/uploadController');

/**
 * @route   POST /api/upload/profile-image
 * @desc    Upload a new profile image (authenticated)
 * @access  Private
 * @body    form-data { image: <binary> }
 */
router.post(
  '/profile-image',
  auth,
  upload('image'),        // ✅ FIXED: call upload('image') instead of upload.single('image')
  handleUploadErrors,
  ctrl.uploadProfile
);

/**
 * @route   GET /api/upload/profile-image?id=<public_id>
 * @desc    Stream a profile image from Cloudinary via server
 * @access  Public
 */
router.get('/profile-image', ctrl.streamProfile);

module.exports = router;
