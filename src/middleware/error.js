import { AppError } from '../common/errors/AppError.js';
import { sendError } from '../common/utils/response.js';

export function notFound(req, res) {
  return sendError(res, {
    status: 404,
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function globalError(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development' || process.env.ENV === 'DEV';
  let error = err;

  if (err?.name === 'ValidationError') {
    error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', Object.values(err.errors).map((item) => item.message));
  } else if (err?.code === 11000) {
    error = new AppError('A unique field already exists', 409, 'DUPLICATE_KEY');
  } else if (err?.name === 'CastError') {
    error = new AppError(`Invalid ${err.path}`, 400, 'INVALID_ID');
  }

  const status = Number(error?.statusCode) || 500;
  const body = {
    success: false,
    message: error?.message || 'Internal server error',
    code: error?.code || 'INTERNAL_ERROR',
    ...(isDev ? { stack: error?.stack } : {}),
  };

  if (error?.details) body.details = error.details;
  return res.status(status).json(body);
}
