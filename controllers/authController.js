const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const response = require('../utils/responseHandler');
const notificationService = require('../services/notificationService');
const axios = require('axios');


// ==========================
// GET ZOHO ACCESS TOKEN USING REFRESH TOKEN
// ==========================
async function getZohoAccessToken() {
  try {
    const res = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: "refresh_token",
        }
      }
    );

    return res.data.access_token;
  } catch (err) {
    console.error("❌ Zoho Token Error:", err.response?.data || err);
    throw new Error("Failed to get Zoho access token.");
  }
}


// ==========================
// SEND EMAIL USING ZOHO MAIL API
// ==========================
async function sendVerificationEmail(user, code) {
  try {
    const accessToken = await getZohoAccessToken();

    const payload = {
      fromAddress: process.env.EMAIL_FROM,
      toAddress: user.email,
      subject: "Verify your ClutchDen account",
      mailFormat: "html",
      content: `
        <div style="font-family:Arial,sans-serif;">
          <h2>Welcome to ClutchDen, ${user.username}!</h2>
          <p>Please verify your email using the code below. This code expires in <b>2 minutes</b>.</p>
          <h1 style="letter-spacing:5px;">${code}</h1>
          <p>If you did not request this registration, ignore this email.</p>
        </div>
      `
    };

    // Replace YOUR_ACCOUNT_ID with your real Zoho Mail account ID
    const accountId = process.env.ZOHO_ACCOUNT_ID;

    const res = await axios.post(
      `https://mail.zoho.com/api/accounts/${accountId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`
        }
      }
    );

    console.log(`📧 Zoho email sent to ${user.email}`);
  } catch (err) {
    console.error("❌ Email send error:", err.response?.data || err);
    throw err;
  }
}



/**
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return response.error(res, 'User already exists', 400);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 2 * 60 * 1000;

    const user = await User.create({
      username,
      email,
      password,
      isVerified: false,
      verificationToken: code,
      verificationExpires: expires,
    });

    await sendVerificationEmail(user, code);

    response.success(
      res,
      {
        email: user.email,
        message: 'Verification code sent. Please verify within 2 minutes.',
      },
      'Verification email sent',
      201
    );

    // Auto-delete unverified users
    setTimeout(async () => {
      const stillUnverified = await User.findOne({ _id: user._id, isVerified: false });
      if (stillUnverified) {
        await User.deleteOne({ _id: user._id });
        console.warn(`🗑️ Deleted unverified user ${user.email}`);
      }
    }, 2 * 60 * 1000);

  } catch (err) {
    console.error('Register error:', err);
    response.error(res, 'Error during registration', 500);
  }
};


/**
 * @route POST /api/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code)
      return response.error(res, 'Email and code are required', 400);

    const user = await User.findOne({
      email,
      verificationToken: code.trim(),
      verificationExpires: { $gt: Date.now() },
    });

    if (!user)
      return response.error(res, 'Invalid or expired verification code', 400);

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const token = generateToken(user);

    await notificationService.createNotification(
      user._id,
      'Email Verified',
      `Hi ${user.username}, your email was successfully verified.`,
      'success'
    );

    response.success(res, {
      message: 'Email verified successfully. You can now log in.',
      token,
    });
  } catch (err) {
    console.error('Verification error:', err);
    response.error(res, 'Verification failed', 500);
  }
};


/**
 * @route POST /api/auth/resend-code
 */
exports.resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return response.error(res, 'Email is required', 400);

    const user = await User.findOne({ email });
    if (!user) return response.error(res, 'User not found', 404);
    if (user.isVerified) return response.error(res, 'Email already verified', 400);

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpires = Date.now() + 2 * 60 * 1000;

    user.verificationToken = newCode;
    user.verificationExpires = newExpires;
    await user.save();

    await sendVerificationEmail(user, newCode);

    response.success(res, {
      message: 'A new verification code has been sent to your email.',
    });

    setTimeout(async () => {
      const stillUnverified = await User.findOne({ _id: user._id, isVerified: false });
      if (stillUnverified) {
        await User.deleteOne({ _id: user._id });
        console.warn(`🗑️ Deleted unverified user ${user.email}`);
      }
    }, 2 * 60 * 1000);

  } catch (err) {
    console.error('Resend error:', err);
    response.error(res, 'Unable to resend verification code', 500);
  }
};


/**
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return response.error(res, 'Invalid credentials', 401);

    if (!user.isVerified)
      return response.error(res, 'Please verify your email first', 401);

    const match = await user.matchPassword(password);
    if (!match) return response.error(res, 'Invalid credentials', 401);

    const token = generateToken(user);

    await notificationService.createNotification(
      user._id,
      'Login Successful',
      `You logged in at ${new Date().toLocaleString()}.`,
      'info'
    );

    response.success(res, {
      id: user._id,
      email: user.email,
      username: user.username,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    response.error(res, 'Error during login', 500);
  }
};