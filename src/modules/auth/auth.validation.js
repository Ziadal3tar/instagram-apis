import Joi from 'joi';

const password = Joi.string().min(6).max(72).required();

export const signUpSchema = {
  body: Joi.object({
    userName: Joi.string().trim().min(2).max(20).required(),
    fullName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().trim().lowercase().email().required(),
    password,
    confirmPassword: Joi.valid(Joi.ref('password')).required(),
  }).required(),
};

export const loginSchema = {
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password,
  }).required(),
};

export const socialLoginSchema = {
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    userName: Joi.string().trim().min(2).max(20).required(),
    fullName: Joi.string().trim().min(2).max(50).required(),
    profilePic: Joi.string().uri().allow('').optional(),
    public_id: Joi.string().allow('').optional(),
    registerType: Joi.string().valid('facebook', 'google').required(),
  }).required(),
};
