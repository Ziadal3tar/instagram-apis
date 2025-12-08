import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { fileValidation, HME, myMulter } from "../../services/multer.js";
import * as reelsControl from './controller/reels.controller.js'
import { auth } from "../../middleware/auth.js";

const router = Router()
router.get("/", (req, res) => {
    res.status(200).json({ message: 'reel Module' })
})

router.post("/addReel",auth(),myMulter(fileValidation.video).single('reel'),HME, reelsControl.addReel)
router.post("/getAllReels",auth(), reelsControl.getAllReels)
export default router
