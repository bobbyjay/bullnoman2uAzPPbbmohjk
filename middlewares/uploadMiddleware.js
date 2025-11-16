const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Use memory storage (ideal for Cloudinary or streaming)
const storage = multer.memoryStorage();

// Max upload size: defaults to 5MB if not set in .env
const MAX_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || '5242880', 10);

// Allowed image types
const allowedTypes = /jpeg|jpg|png|webp/;

// Create multer instance
const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }

    console.error(`❌ Invalid upload attempt: ${file.originalname} (${file.mimetype})`);
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        'Only image files (jpg, jpeg, png, webp) are allowed'
      )
    );
  },
});

/**
 * ✅ uploadSingle(fieldName)
 * Wraps multer.single() to generate a temporary file on disk for Cloudinary
 * Stores it in the system temp directory instead of your project folder
 */
const uploadSingle = (fieldName) => [
  upload.single(fieldName),
  (req, res, next) => {
    try {
      if (req.file && req.file.buffer) {
        const tempPath = path.join(os.tmpdir(), `support_${Date.now()}_${req.file.originalname}`);
        fs.writeFileSync(tempPath, req.file.buffer);
        req.file.path = tempPath; // For Cloudinary uploader compatibility
      }
      next();
    } catch (err) {
      console.error('❌ Upload processing error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error processing uploaded file',
      });
    }
  },
];

/**
 * ✅ Graceful error handler for multer errors
 */
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'Upload failed';
    if (err.code === 'LIMIT_FILE_SIZE')
      message = `File too large. Max size: ${MAX_SIZE / (1024 * 1024)}MB`;
    if (err.code === 'LIMIT_UNEXPECTED_FILE')
      message = 'Only image files are allowed';

    return res.status(400).json({ success: false, error: message });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Unknown upload error',
    });
  }

  next();
};

/**
 * 🧹 Auto-cleanup: remove temp files older than 1 hour
 */
function cleanupOldTempFiles() {
  const tempDir = os.tmpdir();
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds

  try {
    const files = fs.readdirSync(tempDir);

    files.forEach((file) => {
      if (file.startsWith('support_')) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Deleted old temp file: ${file}`);
        }
      }
    });
  } catch (err) {
    console.error('⚠️ Error cleaning temp files:', err.message);
  }
}

// Run cleanup on startup
cleanupOldTempFiles();

// ✅ Export correctly
module.exports = {
  upload: uploadSingle, // <-- use as upload('image') in your routes
  handleUploadErrors,
};
