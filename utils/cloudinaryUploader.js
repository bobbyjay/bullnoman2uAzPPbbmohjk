const { cloudinary } = require('../config/cloudinary');

/**
 * Upload buffer to Cloudinary using upload_stream
 * returns full result (public_id etc.)
 */
async function uploadBufferToCloudinary(buffer, folder = 'profiles') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        overwrite: true,
        type: 'private' // 🔒 CRITICAL: prevents public CDN access
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

/**
 * Destroy a public_id (admin only)
 */
async function destroyPublicId(publicId) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
    type: 'private'
  });
}

module.exports = {
  uploadBufferToCloudinary,
  destroyPublicId
};