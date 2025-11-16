module.exports = {
  success: (res, data = {}, message = 'OK', status = 200) => res.status(status).json({ success: true, message, data }),
  error: (res, message = 'Error', status = 400) => res.status(status).json({ success: false, message })
};
