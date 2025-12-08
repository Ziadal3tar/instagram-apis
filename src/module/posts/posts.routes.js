import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { fileValidation, HME, myMulter } from "../../services/multer.js";
import * as postsControl from './controller/post.controller.js'
import { auth } from "../../middleware/auth.js";

const router = Router()
router.get("/", (req, res) => {
    res.status(200).json({ message: 'post Module' })
})

router.post("/addPost",auth(),myMulter(fileValidation.all).any(),HME, postsControl.addPost)
router.post("/like",auth(), postsControl.like)
router.post("/addComment",auth(), postsControl.addComment)
router.post("/getPostById",auth(), postsControl.getPostById)
router.get("/explore",auth(), postsControl.explore)

export default router