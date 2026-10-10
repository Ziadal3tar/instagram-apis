import mongoose from 'mongoose';
import userModel from '../../database/models/user.model.js';
import postModel from '../../database/models/post.model.js';
import reelModel from '../../database/models/reel.model.js';
import { getPagination } from '../../common/utils/pagination.js';
import { cache } from '../../common/cache/cache.service.js';
import { cacheKeys } from '../../common/cache/keys.js';

const authorProjection = [
  { $project: { _id: 1, userName: 1, fullName: 1, profilePic: 1, profilePicType: 1 } },
];

function contentStages(type, feedUsers, viewerId, limit, { sortByScore = false, from } = {}) {
  const match = { createdBy: { $in: feedUsers } };
  if (from) match.createdAt = { $gte: from };

  const baseProject = {
    _id: 1,
    caption: 1,
    createdBy: 1,
    createdAt: 1,
    likesCount: { $size: { $ifNull: ['$likes', []] } },
    commentsCount: { $size: { $ifNull: ['$comments', []] } },
    viewerLiked: { $in: [new mongoose.Types.ObjectId(viewerId), { $ifNull: ['$likes', []] }] },
    ...(type === 'post' ? { postsImgAndVideos: 1 } : { url: 1, public_id: 1 }),
  };

  return [
    { $match: match },
    ...(sortByScore ? [
      { $addFields: { popularityScore: { $add: [{ $size: { $ifNull: ['$likes', []] } }, { $multiply: [{ $size: { $ifNull: ['$comments', []] } }, 2] }] } } },
      { $sort: { popularityScore: -1, createdAt: -1, _id: -1 } },
    ] : [{ $sort: { createdAt: -1, _id: -1 } }]),
    { $limit: limit },
    { $project: { ...baseProject, ...(sortByScore ? { popularityScore: 1 } : {}) } },
    { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', pipeline: authorProjection, as: 'createdBy' } },
    { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
    { $addFields: { type } },
  ];
}

async function getSocialGraphIds(userId) {
  const [me, followers] = await Promise.all([
    userModel.findById(userId).select('following').lean(),
    userModel.find({ following: userId }).select('_id').limit(500).lean(),
  ]);

  const ids = new Set([String(userId)]);
  for (const id of me?.following || []) ids.add(String(id));
  for (const item of followers) ids.add(String(item._id));
  return [...ids].map((id) => new mongoose.Types.ObjectId(id));
}

export async function buildPersonalizedFeed(userId, query = {}) {
  console.log(`Building personalized feed for user: ${userId}`);
  const { page, limit, skip } = getPagination(query, { limit: 10, maxLimit: 30 });
  const key = cacheKeys.feed(String(userId), page, limit);
  const cached = await cache.get(key);
  if (cached) return cached;

  const feedUsers = await getSocialGraphIds(userId);
  const fetchLimit = Math.min(skip + limit + 1, 120);

  const [posts, reels] = await Promise.all([
    postModel.aggregate(contentStages('post', feedUsers, userId, fetchLimit)),
    reelModel.aggregate(contentStages('reel', feedUsers, userId, fetchLimit)),
  ]);

  const combined = [...posts, ...reels].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || String(b._id).localeCompare(String(a._id)));
  const items = combined.slice(skip, skip + limit);

  const result = { page, limit, items, hasMore: combined.length > skip + limit };
  await cache.set(key, result, 10);
  return result;
}

export async function buildExploreFeed(userId, query = {}) {
  const { page, limit, skip } = getPagination(query, { limit: 20, maxLimit: 30 });
  const key = cacheKeys.explore(String(userId), page, limit);
  const cached = await cache.get(key);
  if (cached) return cached;

  const feedUsers = await getSocialGraphIds(userId);
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const poolLimit = Math.min(skip + limit + 20, 100);

  const [posts, reels] = await Promise.all([
    postModel.aggregate(contentStages('post', feedUsers, userId, poolLimit, { sortByScore: true, from })),
    reelModel.aggregate(contentStages('reel', feedUsers, userId, poolLimit, { sortByScore: true, from })),
  ]);

  const combined = [...posts, ...reels].sort((a, b) => Number(b.popularityScore || 0) - Number(a.popularityScore || 0) || new Date(b.createdAt) - new Date(a.createdAt));
  const pageItems = combined.slice(skip, skip + limit).map(({ popularityScore, ...item }) => item);

  const result = { page, limit, items: pageItems, hasMore: combined.length > skip + limit };
  await cache.set(key, result, 20);
  return result;
}
