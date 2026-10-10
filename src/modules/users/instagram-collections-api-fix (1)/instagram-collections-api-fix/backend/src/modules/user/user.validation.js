import Joi from 'joi';

const objectId = () => Joi.string().hex().length(24);

export const userIdSchema = {
  params: Joi.object({ _id: objectId().required() }),
};

export const profileSchema = {
  body: Joi.object({ _id: objectId().required() }).required(),
};

export const searchSchema = {
  body: Joi.object({ text: Joi.string().trim().min(1).max(50).required() }).required(),
};

export const bioSchema = {
  body: Joi.object({ bio: Joi.string().trim().max(300).allow('').required() }).required(),
};

export const collectionSchema = {
  body: Joi.object({
    collectionName: Joi.string().trim().min(2).max(20).required(),
  }).required(),
};

export const saveSchema = {
  body: Joi.object({
    postId: objectId().required(),
    ref: Joi.string().valid('Post', 'Reel').required(),
  }).required(),
};

export const collectionItemsSchema = {
  body: Joi.object({
    collectionId: objectId().required(),
    selected: Joi.array()
      .items(objectId().required())
      .min(1)
      .max(50)
      .unique()
      .required(),
  }).required(),
};

export const collectionParamsSchema = {
  params: Joi.object({
    collectionId: objectId().required(),
  }).required(),
};

export const collectionItemParamsSchema = {
  params: Joi.object({
    collectionId: objectId().required(),
    itemId: objectId().required(),
  }).required(),
};

export const collectionIdSchema = {
  params: Joi.object({
    id: objectId().required(),
  }).required(),
};
