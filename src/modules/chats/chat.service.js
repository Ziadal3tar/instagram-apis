import chatModel from '../../database/models/chat.model.js';
import mongoose from 'mongoose';
import userModel from '../../database/models/user.model.js';
import { AppError } from '../../common/errors/AppError.js';
import { cache } from '../../common/cache/cache.service.js';

function pairIds(a, b) {
  return [String(a), String(b)].sort().map((id) => new mongoose.Types.ObjectId(id));
}

async function findDirectChat(userId, otherUserId, select) {
  const [first, second] = pairIds(userId, otherUserId);
  return chatModel.findOne({ type: 'chat', userIds: { $all: [first, second] }, $expr: { $eq: [{ $size: '$userIds' }, 2] } })
    .select(select)
    .lean();
}

export async function sendMessage(senderId, to, payload) {
  if (String(senderId) === String(to)) throw new AppError('You cannot message yourself', 400, 'SELF_MESSAGE');

  const recipient = await userModel.findById(to).select('_id').lean();
  if (!recipient) throw new AppError('Recipient not found', 404, 'USER_NOT_FOUND');

  const ids = pairIds(senderId, to);
  let chat = await chatModel.findOne({ type: 'chat', userIds: { $all: ids }, $expr: { $eq: [{ $size: '$userIds' }, 2] } });

  const newMessage = {
    message: payload.message,
    sender: senderId,
    ...(payload.time ? { time: payload.time } : {}),
  };

  if (!chat) {
    chat = await chatModel.create({ userIds: ids, messages: [newMessage], type: 'chat' });
    await userModel.updateMany({ _id: { $in: ids } }, { $addToSet: { chats: chat._id } });
  } else {
    chat = await chatModel.findByIdAndUpdate(
      chat._id,
      { $push: { messages: newMessage }, $set: { updatedAt: new Date() } },
      { new: true, projection: { _id: 1, messages: { $slice: -1 }, updatedAt: 1 } }
    ).lean();
  }

  const message = chat?.messages?.[0] || null;
  await cache.delByPrefix(`me:${String(senderId)}`);
  await cache.delByPrefix(`me:${String(to)}`);

  return { chatId: chat._id, message };
}

export async function getChat(userId, to, query = {}) {
  const limit = Math.min(Number.parseInt(query.limit, 10) || 50, 100);
  const [chat, user] = await Promise.all([
    findDirectChat(userId, to, { _id: 1, userIds: 1, type: 1, messages: { $slice: -limit }, updatedAt: 1 }),
    userModel.findById(to).select('_id userName fullName profilePic active').lean(),
  ]);

  if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  return { user, chat: chat || null, limit };
}
