import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess } from '../../common/utils/response.js';
import * as service from './reel.service.js';

export const addReel = asyncHandler(async (req, res) => sendSuccess(res, { status: 201, message: 'Reel created successfully', data: await service.createReel(req.auth.userId, req.body, req.file) }));
export const getAllReels = asyncHandler(async (req, res) => sendSuccess(res, { data: await service.getAllReels(req.auth.userId, req.query) }));
