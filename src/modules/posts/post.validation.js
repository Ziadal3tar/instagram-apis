import Joi from 'joi';

export const postIdSchema = {
  body: Joi.object({
    _id: Joi.string().length(24).required(),
    type: Joi.string().valid('post', 'reel').optional(),
  }).required(),
};

export const interactionSchema = {
  body: Joi.object({
    _id: Joi.string().length(24).required(),
    type: Joi.string().valid('post', 'reel').required(),
  }).required(),
};

export const commentSchema = {
  body: Joi.object({
    _id: Joi.string().length(24).required(),
    type: Joi.string().valid('post', 'reel').required(),
    comment: Joi.string().trim().min(1).max(1000).required(),
  }).required(),
};
