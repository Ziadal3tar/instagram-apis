import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
import { fileValidation, HME, myMulter } from "../../services/multer.js";
import * as chatsControl from './controller/chats.controller.js'
const router = Router()
router.get("/", (req, res) => {
    res.status(200).json({ message: 'Auth Module' })
})

router.post("/sendMessage",auth(), chatsControl.sendMessage)
router.post("/getChat",auth(), chatsControl.getChat)


export default router