import { Schema, model, Types } from 'mongoose';

const storySchema = new Schema(
  {
    caption: { type: String, trim: true, maxlength: 2200 },
    duration: { type: Number, default: 10, min: 1, max: 60 },
    left: { type: String, default: '0' },
    top: { type: String, default: '0' },
    color: { type: String, default: '#fff' },
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    viewer: [{ type: Types.ObjectId, ref: 'User' }],
    likes: [{ type: Types.ObjectId, ref: 'User' }],
    type: { type: String, required: true, enum: ['image', 'video', 'text'] },
  },
  { timestamps: true, versionKey: false }
);

storySchema.index({ createdBy: 1, createdAt: -1 });
storySchema.index({ createdAt: -1 });

export default model('Story', storySchema);
