const { uploadBufferToCloudinary } = require('../utils/cloudinaryUploader');
const validateImage = require('../utils/validateImage');
const { cloudinary } = require('../config/cloudinary');
const axios = require('axios');

const response = require('../utils/responseHandler');

exports.uploadProfile = async (req, res) => {
  const file = req.file;
  const { valid, message } = validateImage(file);
  if (!valid) return response.error(res, message, 400);

  // upload buffer to Cloudinary (server side)
  const result = await uploadBufferToCloudinary(file.buffer, `users/${req.user._id}`);
  // store only public_id
  req.user.profilePictureId = result.public_id;
  await req.user.save();

  // Return only id that client can use to request stream
  response.success(res, { id: result.public_id }, 'Profile image uploaded', 201);
};

/**
 * Streams image binary through server. Client provides ?id=public_id
 * We DO NOT return Cloudinary URLs to clients.
 */
exports.streamProfile = async (req, res) => {
  const { id } = req.query;
  if (!id) return response.error(res, 'Missing id', 400);

  try {
    // get resource metadata from Cloudinary
    const resource = await cloudinary.api.resource(id, { resource_type: 'image' });
    if (!resource || !resource.secure_url) return response.error(res, 'Not found', 404);

    const streamResp = await axios({
      method: 'GET',
      url: resource.secure_url,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', streamResp.headers['content-type'] || 'application/octet-stream');
    streamResp.data.pipe(res);
  } catch (err) {
    console.error(err.message || err);
    response.error(res, 'Failed to stream', 500);
  }
};
