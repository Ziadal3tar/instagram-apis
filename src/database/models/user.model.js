import { Schema, model, Types } from 'mongoose';
import bcrypt from 'bcrypt';

const collectionSchema = new Schema(
  {
    collectionName: {
      type: String,
      required: [true, 'CollectionName is required'],
      minlength: 2,
      maxlength: 20,
      trim: true,
    },
    saved: [{ type: Types.ObjectId, ref: 'Post' }],
  },
  { timestamps: true }
);

const notificationSchema = new Schema(
  {
    text: { type: String, trim: true },
    seen: { type: Boolean, default: false },
    type: { type: String, trim: true },
    data: { type: Types.ObjectId, ref: 'User' },
    redirect: { type: String, trim: true },
  },
  { _id: true, timestamps: true }
);

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: [true, 'userName is required'],
      minlength: 2,
      maxlength: 20,
      trim: true,
      lowercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'name is required'],
      minlength: 2,
      maxlength: 50,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, select: false },
    phone: { type: String, trim: true },
    bio: { type: String, maxlength: 300, trim: true },
    active: { type: Boolean, default: false },
    confirmEmail: { type: Boolean, default: true },
    blocked: { type: Boolean, default: false },
    profilePic: {
      type: String,
      default: 'https://res.cloudinary.com/dwfz5qvgr/image/upload/v1706456193/th_nbdcp8.jpg',
    },
    profilePicType: {
      type: String,
      default: 'defaultImage',
      enum: ['fbImage', 'googleImage', 'defaultImage', 'UserImage'],
    },
    registerType: {
      type: String,
      default: 'default',
      enum: ['facebook', 'google', 'default'],
    },
    public_id: String,
    DOB: String,

    likes: [{ type: Types.ObjectId }],
    stories: [{ type: Types.ObjectId, ref: 'Story' }],
    posts: [{ type: Types.ObjectId, ref: 'Post' }],
    following: [{ type: Types.ObjectId, ref: 'User' }],
    followers: [{ type: Types.ObjectId, ref: 'User' }],
    visited: [{ type: Types.ObjectId, ref: 'User' }],
    reels: [{ type: Types.ObjectId, ref: 'Reel' }],
    chats: [{ type: Types.ObjectId, ref: 'Chat' }],
    savedPosts: [{ type: Types.ObjectId, ref: 'Post' }],
    savedReels: [{ type: Types.ObjectId, ref: 'Reel' }],
    collections: [collectionSchema],
    notifications: [notificationSchema],
    socketID: { type: String, select: false },
  },
  { timestamps: true, versionKey: false }
);

userSchema.index({ userName: 1 });
userSchema.index({ fullName: 1 });
userSchema.index({ following: 1 });
userSchema.index({ followers: 1 });
userSchema.index({ 'notifications.seen': 1, 'notifications.createdAt': -1 });

userSchema.pre('save', async function save(next) {
  if (!this.isModified('password') || !this.password) return next();
  const rounds = Number(process.env.ROUNDS || process.env.SALTROUND || 10);
  this.password = await bcrypt.hash(this.password, rounds);
  next();
});

export default model('User', userSchema);
