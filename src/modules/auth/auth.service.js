import bcrypt from 'bcrypt';
import userModel from '../../database/models/user.model.js';
import { AppError } from '../../common/errors/AppError.js';
import { createAccessToken } from '../../common/utils/jwt.js';

const AUTH_USER_FIELDS = '_id userName fullName email profilePic profilePicType registerType confirmEmail active blocked';

export async function signUp(payload) {
  const exists = await userModel.exists({ email: payload.email });
  if (exists) throw new AppError('This email is already registered', 409, 'EMAIL_EXISTS');

  const existsUserName = await userModel.exists({ userName: payload.userName.toLowerCase() });
  if (existsUserName) throw new AppError('This username is already taken', 409, 'USERNAME_EXISTS');

  const user = await userModel.create({
    userName: payload.userName,
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
  });

  return { id: user._id, user: user.toObject({ transform: (_, ret) => { delete ret.password; return ret; } }) };
}

export async function login({ email, password }) {
  const user = await userModel.findOne({ email }).select('+password').lean();
  if (!user) throw new AppError('You have to register first', 404, 'USER_NOT_FOUND');
  if (!user.password) throw new AppError('This account uses social login', 400, 'SOCIAL_ACCOUNT');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Invalid password', 401, 'INVALID_PASSWORD');
  if (!user.confirmEmail) throw new AppError('You have to confirm email first', 403, 'EMAIL_NOT_CONFIRMED');
  if (user.blocked) throw new AppError('User is blocked', 403, 'USER_BLOCKED');

  delete user.password;
  return {
    message: 'Welcome',
    token: createAccessToken(user._id),
    id: user._id,
    user,
  };
}

export async function socialLogin(payload) {
  let user = await userModel.findOne({ email: payload.email });

  if (!user) {
    user = await userModel.create({
      userName: payload.userName,
      fullName: payload.fullName,
      email: payload.email,
      profilePic: payload.profilePic || undefined,
      public_id: payload.public_id || undefined,
      registerType: payload.registerType,
      confirmEmail: true,
      active: true,
    });
  } else if (user.registerType !== payload.registerType && user.password) {
    throw new AppError('Email is already registered with password login', 409, 'EMAIL_PROVIDER_CONFLICT');
  }

  return {
    success: true,
    message: 'Welcome',
    token: createAccessToken(user._id),
    id: user._id,
    user: await userModel.findById(user._id).select(AUTH_USER_FIELDS).lean(),
  };
}
