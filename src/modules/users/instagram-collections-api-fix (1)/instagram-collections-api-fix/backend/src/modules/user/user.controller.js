import { asyncHandler } from '../../common/utils/asyncHandler.js';
import { sendSuccess } from '../../common/utils/response.js';
import * as service from './user.service.js';
import * as collectionsService from './user.service.collections.js';

export const getUserData = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: { userData: await service.getMe(req.auth.userId) },
  }),
);

export const getProfilesData = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: await service.getProfile(req.auth.userId, req.body._id),
  }),
);

export const searchUser = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: { users: await service.search(req.auth.userId, req.body.text) },
  }),
);

export const changeUserImage = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'User image updated successfully',
    data: { user: await service.changeProfileImage(req.user, req.file) },
  }),
);

export const visited = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: await service.toggleVisited(req.auth.userId, req.params._id),
  }),
);

export const follow = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: await service.toggleFollow(req.auth.userId, req.params._id),
  }),
);

export const bio = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Bio updated successfully',
    data: { user: await service.updateBio(req.auth.userId, req.body.bio) },
  }),
);

export const allNotificationSeen = asyncHandler(async (req, res) => {
  await service.markNotificationsSeen(req.auth.userId);
  return sendSuccess(res, { message: 'Notifications marked as seen' });
});

export const createCollection = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Collection added',
    data: {
      collection: await collectionsService.createCollection(
        req.auth.userId,
        req.body.collectionName,
      ),
    },
  }),
);

export const toggleSave = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: await collectionsService.toggleSave(
      req.auth.userId,
      req.body.postId,
      req.body.ref,
    ),
  }),
);

export const addToCollection = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Items added to collection',
    data: {
      collection: await collectionsService.addToCollection(
        req.auth.userId,
        req.body.collectionId,
        req.body.selected,
      ),
    },
  }),
);

export const getCollectionItems = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: await collectionsService.getCollectionItems(
      req.auth.userId,
      req.params.collectionId,
    ),
  }),
);

export const getSaved = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: await collectionsService.getSaved(req.auth.userId, req.query),
  }),
);

export const deleteCollection = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Collection deleted successfully',
    data: await collectionsService.deleteCollection(req.auth.userId, req.params.id),
  }),
);

export const removeFromCollection = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Item removed from collection successfully',
    data: await collectionsService.removeFromCollection(
      req.auth.userId,
      req.params.collectionId,
      req.params.itemId,
    ),
  }),
);
