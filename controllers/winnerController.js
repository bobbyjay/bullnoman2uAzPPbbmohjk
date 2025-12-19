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
 * @desc    Add a new winner (Admin only)
 * @access  Private (Admin)
 */
exports.addWinner = async (req, res) => {
  try {
    // 🔒 Admin check
    if (!req.user || !req.user.isAdmin) {
      return response.error(res, 'Access denied: Admins only', 403);
    }

    const {
      username,
      userId,
      amount,
      prize,
      rank,
      imageUrl // ✅ NEW
    } = req.body;

    if (!username && !userId) {
      return response.error(
        res,
        'Winner must have either username or userId',
        400
      );
    }

    // 🔐 Optional sanity check (prevents Cloudinary direct links)
    if (imageUrl && imageUrl.includes('res.cloudinary.com')) {
      return response.error(
        res,
        'Direct Cloudinary URLs are not allowed',
        400
      );
    }

    const winner = new Winner({
      user: userId || null,
      username: username || null,
      amount: Number(amount) || 0,
      prize: prize || 'No prize specified',
      rank: rank || null,
      imageUrl: imageUrl || null, // ✅ STORED DIRECTLY
    });

    await winner.save();

    logger.info(
      `🏆 Admin ${req.user.email} added winner: ${username || userId}`
    );

    response.success(res, winner, 'Winner added successfully', 201);
  } catch (err) {
    logger.error('❌ Error adding winner:', err);
    response.error(res, 'Unable to add winner', 500);
  }
};

