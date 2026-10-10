import mongoose from 'mongoose';
import postModel from '../../database/models/post.model.js';
import reelModel from '../../database/models/reel.model.js';
import userModel from '../../database/models/user.model.js';
import { AppError } from '../../common/errors/AppError.js';
import { cache } from '../../common/cache/cache.service.js';
import { getPagination } from '../../common/utils/pagination.js';
import { uploadFile } from '../../services/upload.service.js';

const modelByType = { post: postModel, reel: reelModel };

function getModel(type) {
  const model = modelByType[type];
  if (!model) throw new AppError('Invalid content type', 400, 'INVALID_TYPE');
  return model;
}

function postProjection() {
  return [
    { $project: {
      _id: 1, caption: 1, postsImgAndVideos: 1, createdBy: 1, createdAt: 1,
      likesCount: { $size: { $ifNull: ['$likes', []] } },
      commentsCount: { $size: { $ifNull: ['$comments', []] } },
    } },
    { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', pipeline: [{ $project: { _id: 1, userName: 1, fullName: 1, profilePic: 1, profilePicType: 1 } }], as: 'createdBy' } },
    { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
  ];
}

export async function createPost(userId, body, files = []) {
  if (!files.length) throw new AppError('At least one media file is required', 400, 'MEDIA_REQUIRED');

  const media = await Promise.all(files.map(async (file) => {
    const uploaded = await uploadFile(file, { folder: 'insta/posts', resourceType: file.mimetype?.startsWith('video/') ? 'video' : 'image' });
    return { url: uploaded.url, public_id: uploaded.public_id, type: file.mimetype?.startsWith('video/') ? 'video' : 'image' };
  }));

  const created = await postModel.create({
    caption: body.caption,
    tags: body.tags,
    createdBy: userId,
    postsImgAndVideos: media,
  });

  await userModel.updateOne({ _id: userId }, { $addToSet: { posts: created._id } });
  await cache.delByPrefix(`feed:${String(userId)}:`);
  await cache.delByPrefix(`explore:${String(userId)}:`);

  return {
    _id: created._id,
    caption: created.caption,
    postsImgAndVideos: created.postsImgAndVideos,
    createdBy: userId,
    createdAt: created.createdAt,
    likesCount: 0,
    commentsCount: 0,
  };
}

export async function toggleLike(userId, id, type) {
  const model = getModel(type);
  const exists = await model.exists({ _id: id });
  if (!exists) throw new AppError('Content not found', 404, 'CONTENT_NOT_FOUND');

  const alreadyLiked = Boolean(await model.exists({ _id: id, likes: userId }));
  const update = alreadyLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
  await model.updateOne({ _id: id }, update);

  const [stats] = await model.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    { $project: { likesCount: { $size: { $ifNull: ['$likes', []] } }, commentsCount: { $size: { $ifNull: ['$comments', []] } } } },
  ]);

  await cache.delByPrefix(`feed:${String(userId)}:`);
  await cache.delByPrefix(`explore:${String(userId)}:`);
  return { liked: !alreadyLiked, likesCount: stats?.likesCount || 0, id, type };
}

export async function addComment(userId, id, type, comment) {
  const model = getModel(type);
  const update = await model.findByIdAndUpdate(
    id,
    { $push: { comments: { userId, comment } } },
    { new: true, projection: { _id: 1, comments: { $slice: -1 } } }
  )
  .populate('comments.userId', '_id userName fullName profilePic')
  .lean();

  if (!update) throw new AppError('Content not found', 404, 'CONTENT_NOT_FOUND');
  const [stats] = await model.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    { $project: { commentsCount: { $size: { $ifNull: ['$comments', []] } } } },
  ]);

  await cache.delByPrefix(`feed:${String(userId)}:`);
  await cache.delByPrefix(`explore:${String(userId)}:`);
  return { id, type, comment: update.comments?.[0] || null, commentsCount: stats?.commentsCount || 0 };
}

export async function getById(viewerId, id, type, query = {}) {
  const models = type ? [getModel(type)] : [postModel, reelModel];
  for (const model of models) {
    const [item] = await model.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      ...postProjection(),
      ...(model === reelModel ? [{ $addFields: { url: '$url', public_id: '$public_id', type: 'reel' } }] : [{ $addFields: { type: 'post' } }]),
    ]);

    if (!item) continue;

    const commentPage = Math.max(Number.parseInt(query.commentPage, 10) || 1, 1);
    const commentLimit = Math.min(Number.parseInt(query.commentLimit, 10) || 30, 50);
    const commentSkip = (commentPage - 1) * commentLimit;
    const [commentsDoc, stats] = await Promise.all([
      model.findById(id)
        .select({ comments: { $slice: [commentSkip, commentLimit] } })
        .populate('comments.userId', '_id userName fullName profilePic')
        .lean(),
      model.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        { $project: { commentsCount: { $size: { $ifNull: ['$comments', []] } } } },
      ]),
    ]);

    return {
      ...item,
      viewerLiked: Boolean(await model.exists({ _id: id, likes: viewerId })),
      comments: commentsDoc?.comments || [],
      commentsPage: commentPage,
      commentsLimit: commentLimit,
      commentsHasMore: (stats?.[0]?.commentsCount || 0) > commentSkip + commentLimit,
    };
  }

  throw new AppError('Content not found', 404, 'CONTENT_NOT_FOUND');
}

export async function explore(viewerId, query) {
  // Kept here as an explicit alias for callers that used /posts/explore historically.
  const { buildExploreFeed } = await import('../feed/feed.service.js');
  return buildExploreFeed(viewerId, query);
}
