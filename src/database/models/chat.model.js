import { Schema, model, Types } from 'mongoose';

const messageSchema = new Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    images: { type: [String], default: [] },
    sender: { type: Types.ObjectId, required: true, ref: 'User' },
    date: { type: String, default: () => new Date().toLocaleDateString('en') },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString('en-US', { hour12: true }),
    },
  },
  { _id: true, timestamps: true }
);

const chatSchema = new Schema(
  {
    userIds: [{ type: Types.ObjectId, ref: 'User', required: true }],
    messages: { type: [messageSchema], default: [] },
    type: { type: String, enum: ['group', 'chat'], default: 'chat' },
  },
  { timestamps: true, versionKey: false }
);

chatSchema.index({ userIds: 1, type: 1 });
chatSchema.index({ updatedAt: -1 });

export default model('Chat', chatSchema);
