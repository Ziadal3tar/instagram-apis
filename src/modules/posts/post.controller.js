import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { sendSuccess } from "../../common/utils/response.js";
import * as service from "./post.service.js";

export const addPost = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    status: 201,
    message: "Post created successfully",
    data: await service.createPost(req.auth.userId, req.body, req.files || []),
  }),
);
export const like = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: await service.toggleLike(
      req.auth.userId,
      req.body._id,
      req.body.type,
    ),
  }),
);
export const addComment = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    status: 201,
    message: "Comment added successfully",
    data: await service.addComment(
      req.auth.userId,
      req.body._id,
      req.body.type,
      req.body.comment,
    ),
  }),
);
export const getPostById = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: {
      post: await service.getById(
        req.auth.userId,
        req.body._id,
        req.body.type,
        req.query,
      ),
    },
  }),
);
export const explore = asyncHandler(async (req, res) =>
  sendSuccess(res, { data: await service.explore(req.auth.userId, req.query) }),
);
