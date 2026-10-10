import jwt from 'jsonwebtoken';
import userModel from '../database/models/user.model.js';
import env from '../config/env.js';
import { AppError } from '../common/errors/AppError.js';
import { asyncHandler } from '../common/utils/asyncHandler.js';

export const roles = Object.freeze({ User: 'User', Admin: 'Admin' });

export const auth = () => asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const prefix = env.bearerKey;

  if (!authorization?.startsWith(prefix)) {
    throw new AppError('Invalid authorization header', 401, 'INVALID_AUTH_HEADER');
  }

  const token = authorization.slice(prefix.length).trim();
  if (!token) throw new AppError('Token is required', 401, 'TOKEN_REQUIRED');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }

  if (!decoded?.id || !decoded?.isLoggedIn) {
    throw new AppError('Invalid token payload', 401, 'INVALID_TOKEN_PAYLOAD');
  }

  const user = await userModel
    .findById(decoded.id)
    .select('_id userName fullName email confirmEmail blocked active profilePic profilePicType public_id')
    .lean();

  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  if (user.blocked) throw new AppError('User is blocked', 403, 'USER_BLOCKED');
  if (!user.confirmEmail) throw new AppError('Email confirmation is required', 403, 'EMAIL_NOT_CONFIRMED');

  req.user = user;
  req.auth = { userId: user._id };
  return next();
});
