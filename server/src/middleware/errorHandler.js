export function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err.stack || err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';

  res.status(status).json({
    error: err.code || 'INTERNAL_ERROR',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
