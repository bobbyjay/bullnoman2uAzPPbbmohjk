const SupportTicket = require('../models/SupportTicket');
const response = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { cloudinary } = require('../config/cloudinary');

/**
 * Helper: Upload image to Cloudinary
 */
async function uploadImage(file) {
  try {
    if (!file || !file.path) {
      logger.warn('⚠️ No file path found for upload.');
      return null;
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'support',
      resource_type: 'image',
    });

    logger.info(`✅ Uploaded to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    logger.error('❌ Cloudinary upload failed:', err.message || err);
    return null;
  }
}

/**
 * @route   POST /support/tickets
 * @desc    Create a new support ticket (with optional image)
 * @access  Private
 */
exports.createTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    logger.info(`📩 Creating support ticket for user: ${req.user?.email}`);
    logger.debug('Body:', req.body);
    logger.debug('File:', req.file ? req.file.originalname : 'No file uploaded');

    if (!subject && !message && !req.file)
      return response.error(res, 'Subject, message, or image required', 400);

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadImage(req.file);
      if (!imageUrl) {
        logger.error('⚠️ Image upload returned null.');
        return response.error(res, 'Image upload failed', 500);
      }
    }

    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject: subject || '(No subject)',
      messages: [
        {
          sender: req.user._id,
          senderRole: req.user.isAdmin ? 'admin' : 'user', // ✅ Added this
          message: message || 'Image uploaded successfully',
          imageUrl: imageUrl || null,
          sentAt: new Date(),
        },
      ],
      status: 'open',
    });

    // Hide image URL from normal users
    const safeTicket = ticket.toObject();
    if (!req.user.isAdmin && imageUrl) {
      safeTicket.messages[0].message = 'Image uploaded successfully';
      delete safeTicket.messages[0].imageUrl;
    }

    logger.info(`🎫 New ticket created by ${req.user.email}: ${subject}`);
    response.success(res, safeTicket, 'Support ticket created successfully', 201);
  } catch (err) {
    logger.error('❌ Error creating support ticket:', err);

    return res.status(500).json({
      success: false,
      message: 'Unable to create ticket',
      error: err.message || err,
    });
  }
};

/**
 * @route   GET /support/tickets
 * @desc    List all tickets for the authenticated user
 * @access  Private
 */
exports.listTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .select('subject status createdAt updatedAt')
      .sort({ updatedAt: -1 });
    response.success(res, tickets);
  } catch (err) {
    logger.error('❌ Error listing tickets:', err);
    response.error(res, 'Unable to list tickets', 500);
  }
};

/**
 * @route   GET /support/ticket/:id
 * @desc    Get a specific ticket and its messages
 * @access  Private
 */
exports.getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('messages.sender', 'username email');

    if (!ticket) return response.error(res, 'Ticket not found', 404);

    // Restrict access to owner or admin
    if (!req.user.isAdmin && ticket.user.toString() !== req.user._id.toString()) {
      return response.error(res, 'Unauthorized', 403);
    }

    // Hide image URLs from normal users
    if (!req.user.isAdmin) {
      ticket.messages.forEach(msg => {
        if (msg.imageUrl) {
          msg.message = 'Image uploaded successfully';
          msg.imageUrl = undefined;
        }
      });
    }

    response.success(res, ticket);
  } catch (err) {
    logger.error('❌ Error fetching ticket:', err);
    response.error(res, 'Unable to fetch ticket', 500);
  }
};

/**
 * @route   POST /support/ticket/:id/messages
 * @desc    Post a reply message to a ticket (with optional image)
 * @access  Private
 */
exports.postMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) return response.error(res, 'Ticket not found', 404);

    // Restrict access to owner or admin
    if (!req.user.isAdmin && ticket.user.toString() !== req.user._id.toString()) {
      return response.error(res, 'Unauthorized', 403);
    }

    if (!message && !req.file)
      return response.error(res, 'Message or image required', 400);

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadImage(req.file);
      if (!imageUrl) return response.error(res, 'Image upload failed', 500);
    }

    ticket.messages.push({
      sender: req.user._id,
      senderRole: req.user.isAdmin ? 'admin' : 'user', // ✅ Added this
      message: message || 'Image uploaded successfully',
      imageUrl: imageUrl || null,
      sentAt: new Date(),
    });

    ticket.updatedAt = new Date();
    await ticket.save();

    // Hide image URL for normal users
    const safeTicket = ticket.toObject();
    if (!req.user.isAdmin) {
      safeTicket.messages = safeTicket.messages.map(msg => {
        if (msg.imageUrl) {
          msg.message = 'Image uploaded successfully';
          delete msg.imageUrl;
        }
        return msg;
      });
    }

    logger.info(`💬 New message added to ticket ${ticket._id} by ${req.user.email}`);
    response.success(res, safeTicket, 'Message sent');
  } catch (err) {
    logger.error('❌ Error posting message:', err);
    response.error(res, 'Unable to post message', 500);
  }
};

/**
 * @route   GET /support/admin/tickets
 * @desc    Admin view of all tickets
 * @access  Private (Admin)
 */
exports.adminListTickets = async (req, res) => {
  try {
    if (!req.user.isAdmin) return response.error(res, 'Forbidden', 403);

    const tickets = await SupportTicket.find()
      .populate('user', 'username email')
      .sort({ updatedAt: -1 });

    response.success(res, tickets);
  } catch (err) {
    logger.error('❌ Error listing all tickets (admin):', err);
    response.error(res, 'Unable to list tickets', 500);
  }
};
