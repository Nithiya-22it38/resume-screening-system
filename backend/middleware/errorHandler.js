const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred.'
    : err.message || 'Internal Server Error';

  res.status(status).json({ error: message });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
};

module.exports = { errorHandler, notFoundHandler };
