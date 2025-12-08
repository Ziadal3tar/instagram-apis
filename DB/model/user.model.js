import { Schema, model, Types } from "mongoose";
import bcrypt from 'bcrypt';

const collectionSchema = new Schema({
  collectionName: {
    type: String,
    required: [true, 'CollectionName is required'],
    min: [2, 'minimum length 2 char'],
    max: [20, 'max length 20 char']
  },
  saved: [
    {
      type: Types.ObjectId,
      ref: 'Post' 
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const userSchema = new Schema({
  userName: { type: String, required: [true, 'userName is required'], min: [2, 'minimum length 2 char'], max: [20, 'max length 20 char'] },
  fullName: { type: String, required: [true, 'name is required'], min: [2, 'minimum length 2 char'], max: [20, 'max length 20 char'] },
  email: { type: String, required: [true, 'email is required'], unique: [true, 'must be unique value'] },
  password: { type: String },
  phone: { type: String },
  bio: { type: String },
  active: { type: Boolean, default: false },
  confirmEmail: { type: Boolean, default: true },
  blocked: { type: Boolean, default: false },
  profilePic: { type: String, default: 'https://res.cloudinary.com/dwfz5qvgr/image/upload/v1706456193/th_nbdcp8.jpg' },
  profilePicType: {
    type: String,
    default: 'defaultImage',
    enum: ["fbImage", "googleImage", "defaultImage", "UserImage"]
  },
  registerType: {
    type: String,
    default: 'default',
    enum: ["facebook", "google", "default"]
  },
  public_id: String,
  DOB: String,

  likes: [{ type: Types.ObjectId, refPath: 'itemModel' }],
  stories: [{ type: Types.ObjectId, ref: "Story" }],
  posts: [{ type: Types.ObjectId, ref: "Post" }],
  following: [{ type: Types.ObjectId, ref: "User" }],
  followers: [{ type: Types.ObjectId, ref: "User" }],
  visited: [{ type: Types.ObjectId, ref: "User" }],
  reels: [{ type: Types.ObjectId, ref: "Reel" }],
  chats: [{ type: Types.ObjectId, ref: "Chat" }],
  savedPosts: [{ type: Types.ObjectId, ref: 'Post' }],
  savedReels: [{ type: Types.ObjectId, ref: 'Reel' }],

  collections: [collectionSchema],

  notifications: [{
    text: { type: String },
    seen: { type: Boolean, default: false },
    type: { type: String },
    data: { type: Types.ObjectId, ref: 'User' },
    redirect: { type: String },
  }],

  socketID: String,

}, { timestamps: true });

userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified('password') || !user.password) {
    return next();
  }
  const rounds = parseInt(process.env.ROUNDS) || 10;
  user.password = bcrypt.hashSync(user.password, rounds);
  next();
});

const userModel = model('User', userSchema);
export default userModel;
