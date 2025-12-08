import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { fileValidation, HME, myMulter } from "../../services/multer.js";
import * as storiesControl from './controller/stories.controller.js'
import { auth } from "../../middleware/auth.js";

const router = Router()
router.get("/", (req, res) => {
    res.status(200).json({ message: 'story Module' })
})

router.post("/addStory",auth(),myMulter(fileValidation.all).single('story'),HME, storiesControl.addStory)
export default router
