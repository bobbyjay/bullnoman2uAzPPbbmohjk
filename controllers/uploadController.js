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
    // upload buffer to Cloudinary (server side)
    const result = await uploadBufferToCloudinary(
      file.buffer,
      `users/${req.user._id}`
    );

    // store only public_id
    req.user.profilePictureId = result.public_id;
    await req.user.save();

    // return only id (no Cloudinary URLs)
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
 * Client provides ?id=public_id
 * Cloudinary URLs never reach the client.
 */
exports.streamProfile = async (req, res) => {
  const { id } = req.query;
  if (!id) return response.error(res, 'Missing id', 400);

  try {
    // OPTIONAL but recommended: ownership check
    if (req.user.profilePictureId !== id) {
      return response.error(res, 'Unauthorized', 403);
    }

    // Generate signed Cloudinary URL (SERVER ONLY)
    const signedUrl = cloudinary.url(id, {
      secure: true,
      sign_url: true,
      resource_type: 'image'
    });

    const streamResp = await axios({
      method: 'GET',
      url: signedUrl,
      responseType: 'stream',
      maxRedirects: 0, // ⛔ critical: prevents CDN redirect
      validateStatus: status => status === 200
    });

    res.setHeader(
      'Content-Type',
      streamResp.headers['content-type'] || 'application/octet-stream'
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');

    streamResp.data.pipe(res);
  } catch (err) {
    console.error(err.response?.status || err.message);
    return response.error(res, 'Failed to stream image', 500);
  }
};