module.exports = function validateImage(file) {
  if (!file) return { valid: false, message: 'No file provided' };
  if (!/image\/(jpeg|jpg|png)/.test(file.mimetype)) return { valid: false, message: 'Invalid image type' };
  const max = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '5242880', 10);
  if (file.size > max) return { valid: false, message: 'File too large' };
  return { valid: true };
};
