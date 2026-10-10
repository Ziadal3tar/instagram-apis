import mongoose from 'mongoose';
import { AppError } from '../errors/AppError.js';

export function assertObjectId(value, field = 'id') {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`Invalid ${field}`, 400, 'INVALID_ID');
  }
  return new mongoose.Types.ObjectId(value);
}
