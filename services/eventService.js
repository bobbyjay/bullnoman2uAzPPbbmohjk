const Event = require('../models/Event');

exports.createEvent = async data => Event.create(data);
exports.updateEvent = async (id, data) => Event.findByIdAndUpdate(id, data, { new: true });
exports.getEvent = async id => Event.findById(id);
