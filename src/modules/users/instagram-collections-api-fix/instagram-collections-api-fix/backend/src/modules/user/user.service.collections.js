import mongoose from 'mongoose';
import userModel from '../../database/models/user.model.js';
import postModel from '../../database/models/post.model.js';
import reelModel from '../../database/models/reel.model.js';
import { AppError } from '../../common/errors/AppError.js';
import { getPagination } from '../../common/utils/pagination.js';
import { cache } from '../../common/cache/cache.service.js';
import { cacheKeys } from '../../common/cache/keys.js';
import { buildPersonalizedFeed } from '../feed/feed.service.js';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function referenceId(value) {
  if (value == null) return null;

  if (typeof value === 'object') {
    // BSON ObjectIds must be handled before their generic object properties.
    if (typeof value.toHexString === 'function') return value.toHexString();
    if (value._id != null && value._id !== value) return referenceId(value._id);
    if (value.id != null && value.id !== value) return referenceId(value.id);
  }

  const id = String(value);
  return id === '[object Object]' ? null : id;
}

function invalidateUser(userId) {
  return Promise.all([
    cache.del(cacheKeys.me(String(userId))),
    cache.delByPrefix(`feed:${String(userId)}:`),
    cache.delByPrefix(`explore:${String(userId)}:`),
  ]);
}

export async function createCollection(userId, collectionName) {
  const updated = await userModel.findByIdAndUpdate(
    userId,
    { $push: { collections: { collectionName } } },
    { new: true }
  ).select('collections').lean();
  if (!updated) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  await invalidateUser(userId);
  return updated.collections.at(-1);
}

export async function toggleSave(userId, postId, ref) {
  const field = ref === 'Post' ? 'savedPosts' : 'savedReels';
  const exists = await userModel.exists({ _id: userId, [`${field}`]: postId });

  if (exists) {
    await userModel.updateOne({ _id: userId }, { $pull: { [field]: postId, 'collections.$[].saved': postId } });
  } else {
    await userModel.updateOne({ _id: userId }, { $addToSet: { [field]: postId } });
  }

  await invalidateUser(userId);
  return { saved: !exists, type: ref.toLowerCase(), postId };
}

export async function addToCollection(userId, collectionId, selected) {
  const requestedIds = [...new Set((Array.isArray(selected) ? selected : []).map(String))];
  if (!requestedIds.length || requestedIds.some((id) => !OBJECT_ID_PATTERN.test(id))) {
    throw new AppError('At least one valid post ID is required', 400, 'INVALID_COLLECTION_ITEMS');
  }

  const user = await userModel
    .findById(userId)
    .select('collections savedPosts')
    .lean();

  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const currentCollection = (user.collections || []).find(
    (item) => String(item._id) === String(collectionId),
  );
  if (!currentCollection) {
    throw new AppError('Collection not found', 404, 'COLLECTION_NOT_FOUND');
  }

  // A collection can only contain posts that this user has already saved.
  const savedPostIds = new Set((user.savedPosts || []).map(referenceId));
  const notSavedIds = requestedIds.filter((id) => !savedPostIds.has(id));
  if (notSavedIds.length) {
    throw new AppError(
      'Only posts already saved to your account can be added to a collection',
      400,
      'POST_NOT_SAVED',
    );
  }

  // Verify the referenced posts still exist so the API never stores stale IDs.
  const existingPosts = await postModel
    .find({ _id: { $in: requestedIds } })
    .select('_id')
    .lean();
  const existingIds = new Set(existingPosts.map((post) => String(post._id)));
  if (requestedIds.some((id) => !existingIds.has(id))) {
    throw new AppError('One or more saved posts no longer exist', 404, 'POST_NOT_FOUND');
  }

  const updated = await userModel.findOneAndUpdate(
    { _id: userId, 'collections._id': collectionId },
    { $addToSet: { 'collections.$.saved': { $each: requestedIds } } },
    { new: true, projection: { 'collections.$': 1 } },
  ).lean();

  if (!updated?.collections?.[0]) {
    throw new AppError('Collection not found', 404, 'COLLECTION_NOT_FOUND');
  }

  await invalidateUser(userId);
  return updated.collections[0];
}

export async function deleteCollection(userId, collectionId) {
  const user = await userModel.findByIdAndUpdate(
    userId,
    { $pull: { collections: { _id: collectionId } } },
    { new: true, projection: { collections: 1 } }
  ).lean();

  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  await invalidateUser(userId);
  return { collections: user.collections };
}

export async function getFeed(userId, query) {
  return buildPersonalizedFeed(userId, query);
}

export async function getSaved(userId, query) {
  const { page, limit, skip } = getPagination(query, {
    limit: 20,
    maxLimit: 50,
  });

  const user = await userModel
    .findById(userId)
    .select('savedPosts savedReels')
    .lean();

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Defensive normalization:
  // old users may not have these fields in MongoDB.
  const savedPosts = Array.isArray(user.savedPosts)
    ? user.savedPosts
    : [];

  const savedReels = Array.isArray(user.savedReels)
    ? user.savedReels
    : [];

  if (!savedPosts.length && !savedReels.length) {
    return {
      page,
      limit,
      items: [],
      hasMore: false,
    };
  }

  const savedIds = [
    ...savedPosts.map((id) => ({
      id: String(id),
      type: 'post',
    })),
    ...savedReels.map((id) => ({
      id: String(id),
      type: 'reel',
    })),
  ];

  const [posts, reels] = await Promise.all([
    postModel.aggregate([
      {
        $match: {
          _id: {
            $in: savedPosts,
          },
        },
      },
      {
        $project: {
          _id: 1,
          caption: 1,
          postsImgAndVideos: 1,
          createdBy: 1,
          createdAt: 1,

          // Do not return full likes/comments arrays.
          likesCount: {
            $size: {
              $ifNull: ['$likes', []],
            },
          },

          commentsCount: {
            $size: {
              $ifNull: ['$comments', []],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                userName: 1,
                fullName: 1,
                profilePic: 1,
                profilePicType: 1,
              },
            },
          ],
          as: 'createdBy',
        },
      },
      {
        $unwind: {
          path: '$createdBy',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]),

    reelModel.aggregate([
      {
        $match: {
          _id: {
            $in: savedReels,
          },
        },
      },
      {
        $project: {
          _id: 1,
          caption: 1,
          url: 1,
          public_id: 1,
          createdBy: 1,
          createdAt: 1,

          likesCount: {
            $size: {
              $ifNull: ['$likes', []],
            },
          },

          commentsCount: {
            $size: {
              $ifNull: ['$comments', []],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                _id: 1,
                userName: 1,
                fullName: 1,
                profilePic: 1,
                profilePicType: 1,
              },
            },
          ],
          as: 'createdBy',
        },
      },
      {
        $unwind: {
          path: '$createdBy',
          preserveNullAndEmptyArrays: true,
        },
      },
    ]),
  ]);

  const byId = new Map();

  for (const item of posts) {
    byId.set(`${String(item._id)}:post`, {
      ...item,
      type: 'post',
    });
  }

  for (const item of reels) {
    byId.set(`${String(item._id)}:reel`, {
      ...item,
      type: 'reel',
    });
  }

  const saved = savedIds
    .map(({ id, type }) => byId.get(`${id}:${type}`))
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  const pageItems = saved.slice(skip, skip + limit);

  return {
    page,
    limit,
    items: pageItems,
    hasMore: saved.length > skip + limit,
  };
}


/**
 * Resolve the references stored by a collection into display-ready Post data.
 * Collection documents store Post IDs; the client should not have to guess
 * media fields from the paginated /getSaved or profile response.
 */
export async function getCollectionItems(userId, collectionId) {
  const user = await userModel.findById(userId).select('collections').lean();
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const collection = (user.collections || []).find(
    (item) => String(item._id) === String(collectionId),
  );
  if (!collection) {
    throw new AppError('Collection not found', 404, 'COLLECTION_NOT_FOUND');
  }

  const rawEntries = Array.isArray(collection.saved) ? collection.saved : [];
  const rawIds = rawEntries.map(referenceId);
  const invalidReferenceIds = rawIds
    .filter((id) => !id || !OBJECT_ID_PATTERN.test(id))
    .map((id) => id || '[invalid reference]');
  const ids = [...new Set(rawIds.filter((id) => id && OBJECT_ID_PATTERN.test(id)))];

  if (!ids.length) {
    return {
      collection: {
        _id: String(collection._id),
        collectionName: collection.collectionName,
        saved: rawEntries,
      },
      items: [],
      unavailableItemIds: invalidReferenceIds,
    };
  }

  const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
  const viewerObjectId = new mongoose.Types.ObjectId(String(userId));

  const posts = await postModel.aggregate([
    { $match: { _id: { $in: objectIds } } },
    {
      $project: {
        _id: 1,
        caption: 1,
        postsImgAndVideos: 1,
        createdBy: 1,
        createdAt: 1,
        likesCount: { $size: { $ifNull: ['$likes', []] } },
        commentsCount: { $size: { $ifNull: ['$comments', []] } },
        viewerLiked: { $in: [viewerObjectId, { $ifNull: ['$likes', []] }] },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        pipeline: [{
          $project: {
            _id: 1,
            userName: 1,
            fullName: 1,
            profilePic: 1,
            profilePicType: 1,
          },
        }],
        as: 'createdBy',
      },
    },
    { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
    { $addFields: { type: 'post' } },
  ]);

  const postsById = new Map(posts.map((post) => [String(post._id), post]));
  const items = ids.map((id) => postsById.get(id)).filter(Boolean);
  const unavailableItemIds = [
    ...invalidReferenceIds,
    ...ids.filter((id) => !postsById.has(id)),
  ];

  return {
    collection: {
      _id: String(collection._id),
      collectionName: collection.collectionName,
      saved: rawEntries,
    },
    items,
    unavailableItemIds,
  };
}

export async function removeFromCollection(userId, collectionId, itemId) {
  if (!OBJECT_ID_PATTERN.test(String(collectionId)) || !OBJECT_ID_PATTERN.test(String(itemId))) {
    throw new AppError('Valid collection and post IDs are required', 400, 'INVALID_COLLECTION_ITEM_ID');
  }

  const user = await userModel.findById(userId).select('collections').lean();
  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

  const collection = (user.collections || []).find(
    (item) => String(item._id) === String(collectionId),
  );
  if (!collection) {
    throw new AppError('Collection not found', 404, 'COLLECTION_NOT_FOUND');
  }

  const containsItem = (collection.saved || []).some(
    (entry) => referenceId(entry) === String(itemId),
  );
  if (!containsItem) {
    throw new AppError('Post is not in this collection', 404, 'COLLECTION_ITEM_NOT_FOUND');
  }

  const updatedUser = await userModel.findOneAndUpdate(
    {
      _id: userId,
      collections: {
        $elemMatch: {
          _id: collectionId,
          saved: itemId,
        },
      },
    },
    { $pull: { 'collections.$.saved': itemId } },
    { new: true, projection: { 'collections.$': 1 } },
  ).lean();

  const updatedCollection = updatedUser?.collections?.[0];
  if (!updatedCollection) {
    throw new AppError('Post is no longer in this collection', 409, 'COLLECTION_ITEM_CHANGED');
  }

  await invalidateUser(userId);
  return {
    collection: updatedCollection,
    removedItemId: String(itemId),
  };
}
