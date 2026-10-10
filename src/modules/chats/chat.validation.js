import Joi from 'joi';

export const chatUserSchema = {
  body: Joi.object({ to: Joi.string().length(24).required() }).required(),
};

export const sendMessageSchema = {
  body: Joi.object({
    to: Joi.string().length(24).required(),
    message: Joi.string().trim().max(5000).allow('').required(),
    time: Joi.string().max(30).optional(),
  }).required(),
};
