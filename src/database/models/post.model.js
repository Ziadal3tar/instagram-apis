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

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    type: { type: String, enum: ['video', 'image'], required: true },
  },
  { _id: false }
);

const postSchema = new Schema(
  {
    caption: { type: String, trim: true, maxlength: 2200 },
    postsImgAndVideos: { type: [mediaSchema], default: [] },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tags: [{ type: Types.ObjectId, ref: 'User' }],
    likes: [{ type: Types.ObjectId, ref: 'User' }],
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

postSchema.index({ createdBy: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ 'likes.0': 1 });

export default model('Post', postSchema);
