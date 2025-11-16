const Event = require('../models/Event');
const response = require('../utils/responseHandler');

/**
 * @route   GET /events
 * @desc    List all available events
 * @access  Authenticated users
 */
exports.listEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    if (!events.length) return response.success(res, [], 'No events available yet');
    response.success(res, events, 'Events retrieved successfully');
  } catch (err) {
    console.error('Error fetching events:', err.message);
    response.error(res, 'Failed to retrieve events', 500);
  }
};

/**
 * @route   GET /events/:id
 * @desc    Get single event by ID
 * @access  Authenticated users
 */
exports.getEvent = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) return response.error(res, 'Event not found', 404);
  response.success(res, event);
};

/**
 * @route   POST /events
 * @desc    Create or update event (admin only)
 * @access  Admin
 */
exports.createOrUpdate = async (req, res) => {
  try {
    const data = req.body;
    if (data._id) {
      const ev = await Event.findByIdAndUpdate(data._id, data, { new: true });
      if (!ev) return response.error(res, 'Event not found', 404);
      return response.success(res, ev, 'Updated');
    }

    const ev = await Event.create(data);
    response.success(res, ev, 'Created', 201);
  } catch (err) {
    console.error('Error creating/updating event:', err.message);
    response.error(res, err.message, 400);
  }
};
