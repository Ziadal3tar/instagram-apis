import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess } from '../../common/utils/response.js';
import * as authService from './auth.service.js';

export const signUp = asyncHandler(async (req, res) => {
  const data = await authService.signUp(req.body);
  return sendSuccess(res, { status: 201, message: 'Account created successfully', data });
});

export const logIn = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  return sendSuccess(res, { message: data.message, data });
});

export const loginWithGoogle = asyncHandler(async (req, res) => {
  const data = await authService.socialLogin({ ...req.body, registerType: 'google' });
  return sendSuccess(res, { status: 200, data });
});

export const loginWithFB = asyncHandler(async (req, res) => {
  const data = await authService.socialLogin({ ...req.body, registerType: 'facebook' });
  return sendSuccess(res, { status: 200, data });
});

export const logInWithFbOrGoogle = asyncHandler(async (req, res) => {
  const data = await authService.socialLogin(req.body);
  return sendSuccess(res, { status: 200, data });
});
