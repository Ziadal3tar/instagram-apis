import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { sendSuccess } from "../../common/utils/response.js";
import * as service from "./chat.service.js";

export const sendMessage = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    status: 201,
    message: "Message sent successfully",
    data: await service.sendMessage(req.auth.userId, req.body.to, req.body),
  }),
);
export const getChat = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: await service.getChat(req.auth.userId, req.body.to, req.query),
  }),
);
