import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess } from '../../common/utils/response.js';
import {
  buildPersonalizedFeed,
  buildExploreFeed,
} from './feed.service.js';

const router = Router();

/**
 * Personalized feed
 *
 * GET /feed?page=1&limit=10
 */
router.get(
  '/',
  auth(),
  asyncHandler(async (req, res) => {
    const data = await buildPersonalizedFeed(
      req.auth.userId,
      req.query
    );

    return sendSuccess(res, {
      data,
    });
  })
);

/**
 * Explore feed
 *
 * GET /feed/explore?page=1&limit=20
 */
router.get(
  '/explore',
  auth(),
  asyncHandler(async (req, res) => {
    const data = await buildExploreFeed(
      req.auth.userId,
      req.query
    );

    return sendSuccess(res, {
      data,
    });
  })
);

export default router;