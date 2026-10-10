import reelModel from '../../database/models/reel.model.js';
import mongoose from 'mongoose';
import userModel from '../../database/models/user.model.js';
import { AppError } from '../../common/errors/AppError.js';
import { cache } from '../../common/cache/cache.service.js';
import { uploadFile } from '../../services/upload.service.js';

export async function createReel(userId, body, file) {
  if (!file) throw new AppError('Reel video is required', 400, 'MEDIA_REQUIRED');
  const uploaded = await uploadFile(file, { folder: 'insta/reels', resourceType: 'video' });
  const reel = await reelModel.create({
    caption: body.caption,
    tags: body.tags,
    public_id: uploaded.public_id,
    url: uploaded.url,
    createdBy: userId,
  });
  await userModel.updateOne({ _id: userId }, { $addToSet: { reels: reel._id } });
  await cache.delByPrefix(`feed:${String(userId)}:`);
  await cache.delByPrefix(`explore:${String(userId)}:`);
  return { _id: reel._id, caption: reel.caption, public_id: reel.public_id, url: reel.url, createdBy: userId, createdAt: reel.createdAt, likesCount: 0, commentsCount: 0 };
}

export async function getAllReels(viewerId, query) {
  const limit = Math.min(Number.parseInt(query.limit, 10) || 10, 30);
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const skip = (page - 1) * limit;
  const reels = await reelModel.aggregate([
    { $sort: { createdAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: limit + 1 },
    { $project: {
      _id: 1, caption: 1, url: 1, public_id: 1, createdBy: 1, createdAt: 1,
      likesCount: { $size: { $ifNull: ['$likes', []] } },
      commentsCount: { $size: { $ifNull: ['$comments', []] } },
      viewerLiked: { $in: [new mongoose.Types.ObjectId(viewerId), { $ifNull: ['$likes', []] }] },
    } },
    { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', pipeline: [{ $project: { _id: 1, userName: 1, fullName: 1, profilePic: 1 } }], as: 'createdBy' } },
    { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
  ]);

  const hasMore = reels.length > limit;
  if (hasMore) reels.pop();
  return { page, limit, reels, hasMore };
}
