import storyModel from '../../database/models/story.model.js';
import userModel from '../../database/models/user.model.js';
import { AppError } from '../../common/errors/AppError.js';
import { uploadFile } from '../../services/upload.service.js';
import { cache } from '../../common/cache/cache.service.js';
import { cacheKeys } from '../../common/cache/keys.js';

export async function createStory(userId, body, file) {
  if (!file) throw new AppError('Story media is required', 400, 'MEDIA_REQUIRED');
  const isVideo = file.mimetype?.startsWith('video/');
  const uploaded = await uploadFile(file, { folder: 'insta/stories', resourceType: isVideo ? 'video' : 'image' });

  const story = await storyModel.create({
    caption: body.caption,
    duration: body.duration,
    left: body.left,
    top: body.top,
    color: body.color,
    public_id: uploaded.public_id,
    url: uploaded.url,
    createdBy: userId,
    type: isVideo ? 'video' : 'image',
  });

  await userModel.updateOne({ _id: userId }, { $addToSet: { stories: story._id } });
  await cache.del(cacheKeys.me(String(userId)));

  return {
    _id: story._id,
    caption: story.caption,
    duration: story.duration,
    left: story.left,
    top: story.top,
    color: story.color,
    public_id: story.public_id,
    url: story.url,
    createdBy: story.createdBy,
    type: story.type,
    createdAt: story.createdAt,
  };
}
