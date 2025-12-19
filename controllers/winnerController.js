const Winner = require('../models/Winner');
const response = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { cloudinary } = require('../config/cloudinary');

/**
 * @route   GET /winners/recent
 * @desc    Get the most recent winners
 * @access  Public
 */
exports.recent = async (req, res) => {
  try {
    const winners = await Winner.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'username');
    response.success(res, winners);
  } catch (err) {
    logger.error('❌ Error fetching recent winners:', err);
    response.error(res, 'Unable to fetch recent winners', 500);
  }
};

/**
 * @route   GET /winners/top
 * @desc    Get top winners by total amount
 * @access  Public
 */
exports.top = async (req, res) => {
  try {
    const top = await Winner.aggregate([
      { $group: { _id: '$user', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          user: { _id: 1, username: '$user.username' },
          total: 1,
        },
      },
    ]);

    response.success(res, top);
  } catch (err) {
    logger.error('❌ Error fetching top winners:', err);
    response.error(res, 'Unable to fetch top winners', 500);
  }
};

/**
 * @route   POST /winners
 * @access  Private (Admin)
 * @desc    Admin adds winner WITH image upload
 */
exports.addWinner = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return response.error(res, 'Access denied: Admins only', 403);
    }

    // ✅ Normalize form-data values
    const username =
      typeof req.body.username === 'string' && req.body.username.trim()
        ? req.body.username.trim()
        : null;

    const userId =
      typeof req.body.userId === 'string' && req.body.userId.trim()
        ? req.body.userId.trim()
        : null;

    const amount = Number(req.body.amount) || 0;
    const prize = req.body.prize || 'No prize specified';
    const rank = req.body.rank ? Number(req.body.rank) : null;

    // ✅ FIXED validation
    if (!username && !userId) {
      return response.error(
        res,
        'Winner must have either username or userId',
        400
      );
    }

    let imageUrl = null;

    if (req.file) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        folder: 'winners',
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      });

      imageUrl = upload.secure_url;
    }

    const winner = new Winner({
      user: userId,
      username,
      amount,
      prize,
      rank,
      imageUrl,
    });

    await winner.save();

    response.success(res, winner, 'Winner added successfully', 201);
  } catch (err) {
    console.error('❌ Error adding winner:', err);
    response.error(res, 'Unable to add winner', 500);
  }
};

