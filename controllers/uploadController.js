const { uploadBufferToCloudinary } = require('../utils/cloudinaryUploader');
const validateImage = require('../utils/validateImage');
const { cloudinary } = require('../config/cloudinary');
const axios = require('axios');
const response = require('../utils/responseHandler');

/**
 * Upload profile image
 */
exports.uploadProfile = async (req, res) => {
  const file = req.file;
  const { valid, message } = validateImage(file);
  if (!valid) return response.error(res, message, 400);

  try {
    const result = await uploadBufferToCloudinary(
      file.buffer,
      `users/${req.user._id}`
    );

    req.user.profilePictureId = result.public_id;
    await req.user.save();

    return response.success(
      res,
      { id: result.public_id },
      'Profile image uploaded',
      201
    );
  } catch (err) {
    console.error(err.message || err);
    return response.error(res, 'Upload failed', 500);
  }
};

/**
 * Streams image binary through server.
 * Client ONLY talks to this API.
 * No Cloudinary referrer or headers reach the client.
 */
exports.streamProfile = async (req, res) => {
  const { id } = req.query;
  if (!id) return response.error(res, 'Missing id', 400);

  try {
    if (req.user.profilePictureId !== id) {
      return response.error(res, 'Unauthorized', 403);
    }

    // Signed Cloudinary URL (SERVER-ONLY)
    const signedUrl = cloudinary.url(id, {
      secure: true,
      sign_url: true,
      resource_type: 'image'
    });

    const streamResp = await axios({
      method: 'GET',
      url: signedUrl,
      responseType: 'stream',
      maxRedirects: 0,
      validateStatus: s => s === 200,
      headers: {
        // ⛔ do not forward client referrer upstream
        Referer: '',
        Origin: ''
      }
    });

    // ⛔ Strip ALL upstream headers
    res.removeHeader('Referer');
    res.removeHeader('Origin');

    // ✅ Explicit safe headers only
    res.setHeader(
      'Content-Type',
      streamResp.headers['content-type'] || 'application/octet-stream'
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Referrer-Policy', 'no-referrer');

    streamResp.data.pipe(res);
  } catch (err) {
    console.error(err.response?.status || err.message);
    return response.error(res, 'Failed to stream image', 500);
  }
};