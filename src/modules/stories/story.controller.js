import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess } from '../../common/utils/response.js';
import * as service from './story.service.js';

export const addStory = asyncHandler(async (req, res) => sendSuccess(res, { status: 201, message: 'Story created successfully', data: await service.createStory(req.auth.userId, req.body, req.file) }));
