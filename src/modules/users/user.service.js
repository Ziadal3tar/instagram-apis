import mongoose from 'mongoose';
import userModel from '../../database/models/user.model.js';
import postModel from '../../database/models/post.model.js';
import reelModel from '../../database/models/reel.model.js';
import storyModel from '../../database/models/story.model.js';
import chatModel from '../../database/models/chat.model.js';
import { AppError } from '../../common/errors/AppError.js';
import { cache } from '../../common/cache/cache.service.js';
import { cacheKeys } from '../../common/cache/keys.js';
import { uploadFile, deleteFile } from '../../services/upload.service.js';

const BASIC_USER_FIELDS = '_id userName fullName email bio profilePic profilePicType registerType active';
const PUBLIC_USER_FIELDS = '_id userName fullName bio profilePic profilePicType active';

function invalidateUserCaches(userId) {
  return Promise.all([
    cache.del(cacheKeys.me(String(userId))),
    cache.del(cacheKeys.profile(String(userId))),
    cache.delByPrefix(`feed:${String(userId)}:`),
    cache.delByPrefix(`explore:${String(userId)}:`),
  ]);
}

export async function getMe(userId) {
  const key = cacheKeys.me(String(userId));
  const cached = await cache.get(key);
  if (cached) return cached;

  const [user] = await userModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    { $project: {
      _id: 1, userName: 1, fullName: 1, email: 1, bio: 1, profilePic: 1, profilePicType: 1, registerType: 1, active: 1,
      following: { $slice: [{ $ifNull: ['$following', []] }, 50] },
      notifications: { $slice: [{ $ifNull: ['$notifications', []] }, -30] },
      visited: { $slice: [{ $ifNull: ['$visited', []] }, -20] },
      collections: { $slice: [{ $ifNull: ['$collections', []] }, -50] },
      unseenNotifications: { $size: { $filter: { input: { $ifNull: ['$notifications', []] }, as: 'n', cond: { $eq: ['$$n.seen', false] } } } },
    } },
  ]);

  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const followingIds = user.following || [];
  const [following, chats, stories] = await Promise.all([
    userModel.find({ _id: { $in: followingIds } }).select(PUBLIC_USER_FIELDS).lean(),
    chatModel.find({ userIds: userId })
      .select('_id userIds type updatedAt messages')
      .slice('messages', -1)
      .populate('userIds', PUBLIC_USER_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean(),
    storyModel.find({ createdBy: { $in: [userId, ...followingIds] }, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
      .select('_id caption duration left top color public_id url createdBy type createdAt')
      .populate('createdBy', PUBLIC_USER_FIELDS)
      .sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const [notificationActors, visitedUsers] = await Promise.all([
    userModel.find({ _id: { $in: (user.notifications || []).map((item) => item.data).filter(Boolean) } }).select(PUBLIC_USER_FIELDS).lean(),
    userModel.find({ _id: { $in: user.visited || [] } }).select(PUBLIC_USER_FIELDS).lean(),
  ]);
  const notificationActorsById = new Map(notificationActors.map((item) => [String(item._id), item]));
  const visitedById = new Map(visitedUsers.map((item) => [String(item._id), item]));

  const notifications = (user.notifications || [])
    .slice(-30)
    .reverse()
    .map((item) => ({
      ...item,
      data: notificationActorsById.get(String(item.data)) || null,
    }));

  const result = {
    ...user,
    notifications,
    unseenNotifications: user.unseenNotifications || 0,
    following: following.map(({ _id, userName, fullName, bio, profilePic, profilePicType, active }) => ({ _id, userName, fullName, bio, profilePic, profilePicType, active })),
    chats: chats.map((chat) => ({
      _id: chat._id,
      userIds: chat.userIds || [],
      type: chat.type,
      updatedAt: chat.updatedAt,
      messages: chat.messages || [],
    })),
    stories,
    visited: (user.visited || []).map((id) => visitedById.get(String(id))).filter(Boolean),
    collections: user.collections || [],
  };

  delete result.email;
  await cache.set(key, result, 20);
  return result;
}

export async function getProfile(viewerId, profileId) {
  const [user] = await userModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(profileId) } },
    {
      $project: {
        _id: 1,
        userName: 1,
        fullName: 1,
        bio: 1,
        profilePic: 1,
        profilePicType: 1,
        active: 1,
        followersCount: { $size: { $ifNull: ['$followers', []] } },
        followingCount: { $size: { $ifNull: ['$following', []] } },
        isFollowing: { $in: [new mongoose.Types.ObjectId(viewerId), { $ifNull: ['$followers', []] }] },
      },
    },
  ]);

  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const viewerObjectId = new mongoose.Types.ObjectId(viewerId);
  const authorLookup = [{ $project: { _id: 1, userName: 1, fullName: 1, bio: 1, profilePic: 1, profilePicType: 1, active: 1 } }];
  const [posts, reels] = await Promise.all([
    postModel.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(profileId) } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: 50 },
      { $project: {
        _id: 1, caption: 1, postsImgAndVideos: 1, createdBy: 1, createdAt: 1,
        likesCount: { $size: { $ifNull: ['$likes', []] } },
        commentsCount: { $size: { $ifNull: ['$comments', []] } },
        viewerLiked: { $in: [viewerObjectId, { $ifNull: ['$likes', []] }] },
      } },
      { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', pipeline: authorLookup, as: 'createdBy' } },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      { $addFields: { type: 'post' } },
    ]),
    reelModel.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(profileId) } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: 50 },
      { $project: {
        _id: 1, caption: 1, url: 1, public_id: 1, createdBy: 1, createdAt: 1,
        likesCount: { $size: { $ifNull: ['$likes', []] } },
        commentsCount: { $size: { $ifNull: ['$comments', []] } },
        viewerLiked: { $in: [viewerObjectId, { $ifNull: ['$likes', []] }] },
      } },
      { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', pipeline: authorLookup, as: 'createdBy' } },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      { $addFields: { type: 'reel' } },
    ]),
  ]);

  const allPosts = [...posts, ...reels]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return { profile: user, allPosts };
}

export async function search(viewerId, text) {
  const value = text.trim();
  if (!value) return [];

  return userModel.find({
    _id: { $ne: viewerId },
    $or: [
      { userName: { $regex: `^${escapeRegex(value)}`, $options: 'i' } },
      { fullName: { $regex: `^${escapeRegex(value)}`, $options: 'i' } },
    ],
  }).select(PUBLIC_USER_FIELDS).sort({ userName: 1 }).limit(20).lean();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function changeProfileImage(user, file) {
  if (!file) throw new AppError('Image is required', 400, 'IMAGE_REQUIRED');
  const uploaded = await uploadFile(file, { folder: 'insta/usersImages', resourceType: 'image' });

  if (user.profilePicType === 'UserImage' && user.public_id) {
    await deleteFile(user.public_id).catch(() => undefined);
  }

  const updated = await userModel.findByIdAndUpdate(
    user._id,
    { public_id: uploaded.public_id, profilePic: uploaded.url, profilePicType: 'UserImage' },
    { new: true }
  ).select(PUBLIC_USER_FIELDS).lean();

  await invalidateUserCaches(user._id);
  return updated;
}

export async function toggleVisited(userId, targetId) {
  if (String(userId) === String(targetId)) return { visited: false };
  const exists = Boolean(await userModel.exists({ _id: userId, visited: targetId }));
  await userModel.updateOne(
    { _id: userId },
    exists ? { $pull: { visited: targetId } } : { $addToSet: { visited: targetId } }
  );
  await cache.del(cacheKeys.me(String(userId)));
  return { visited: !exists };
}

export async function toggleFollow(userId, targetId) {
  if (String(userId) === String(targetId)) throw new AppError('You cannot follow yourself', 400, 'SELF_FOLLOW');

  const target = await userModel.findById(targetId).select('_id').lean();
  if (!target) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const isFollowing = Boolean(await userModel.exists({ _id: userId, following: targetId }));
  const update = isFollowing ? { $pull: { following: targetId } } : { $addToSet: { following: targetId } };
  const reverseUpdate = isFollowing ? { $pull: { followers: userId } } : { $addToSet: { followers: userId } };

  await Promise.all([
    userModel.updateOne({ _id: userId }, update),
    userModel.updateOne({ _id: targetId }, reverseUpdate),
  ]);

  await Promise.all([
    invalidateUserCaches(userId),
    invalidateUserCaches(targetId),
  ]);

  return {
    action: isFollowing ? 'unfollow' : 'follow',
    isFollowing: !isFollowing,

  };
}

export async function updateBio(userId, bio) {
  const updated = await userModel.findByIdAndUpdate(userId, { $set: { bio: bio.trim().slice(0, 300) } }, { new: true })
    .select(PUBLIC_USER_FIELDS).lean();
  if (!updated) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  await invalidateUserCaches(userId);
  return updated;
}

export async function markNotificationsSeen(userId) {
  await userModel.updateOne(
    { _id: userId, 'notifications.seen': false },
    { $set: { 'notifications.$[notification].seen': true } },
    { arrayFilters: [{ 'notification.seen': false }] }
  );
  await invalidateUserCaches(userId);
}
