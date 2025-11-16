const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validateRequest');
const auth = require('../controllers/authController');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user and send email verification code
 */
router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  auth.register
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email using 6-digit code
 */
router.post(
  '/verify-email',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits'),
  ],
  validate,
  auth.verifyEmail
);

/**
 * @route   POST /api/auth/resend-code
 * @desc    Resend new verification code
 */
router.post(
  '/resend-code',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required'),
  ],
  validate,
  auth.resendCode
);

/**
 * @route   POST /api/auth/login
 * @desc    Log in existing verified user
 */
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').exists(),
  ],
  validate,
  auth.login
);

module.exports = router;
