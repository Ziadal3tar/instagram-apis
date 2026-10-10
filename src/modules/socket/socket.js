import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import userModel from '../../database/models/user.model.js';
import env from '../../config/env.js';
import { notificationText } from '../../common/constants/notifications.js';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: true, credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    socket.on('updateSocketId', async (token) => {
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        if (!decoded?.id) return;
        await userModel.updateOne({ _id: decoded.id }, { $set: { socketID: socket.id } });
      } catch (error) {
        if (env.nodeEnv === 'development') console.error('socket auth error:', error.message);
      }
    });

    socket.on('notification', async (data) => {
      try {
        if (!data?.eventName || !data?.to || !data?.data) return;
        const actor = await userModel.findById(data.data).select('userName').lean();
        if (!actor) return;

        const notification = {
          text: `${actor.userName} ${notificationText[data.eventName] || ''}`.trim(),
          data: actor._id,
          type: data.type || data.eventName,
          createdAt: new Date(),
        };

        const recipient = await userModel.findByIdAndUpdate(
          data.to,
          { $push: { notifications: { $each: [notification], $slice: -100 } } },
          { new: true, projection: { socketID: 1 } }
        ).lean();

        if (recipient?.socketID) io.to(recipient.socketID).emit('notification', { message: 'New notification', payload: notification });
      } catch (error) {
        if (env.nodeEnv === 'development') console.error('notification error:', error.message);
      }
    });

    socket.on('disconnect', async () => {
      await userModel.updateOne({ socketID: socket.id }, { $unset: { socketID: 1 } }).catch(() => undefined);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.IO is not initialized');
  return io;
}
