import { Schema, model, Types } from 'mongoose';

const replySchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    reply: { type: String, required: true, trim: true, maxlength: 1000 },
    hide: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const commentSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    replies: [replySchema],
  },
  { timestamps: true }
);

const reelSchema = new Schema(
  {
    caption: { type: String, trim: true, maxlength: 2200 },
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tags: [{ type: Types.ObjectId, ref: 'User' }],
    likes: [{ type: Types.ObjectId, ref: 'User' }],
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

reelSchema.index({ createdBy: 1, createdAt: -1 });
reelSchema.index({ createdAt: -1 });
reelSchema.index({ tags: 1 });

export default model('Reel', reelSchema);
