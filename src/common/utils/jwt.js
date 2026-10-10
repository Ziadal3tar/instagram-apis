import jwt from 'jsonwebtoken';
import env from '../../config/env.js';

export function createAccessToken(userId) {
  return jwt.sign({ id: userId, isLoggedIn: true }, env.jwtSecret, { expiresIn: '2d' });
}
