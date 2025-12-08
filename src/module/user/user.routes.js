import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
import { fileValidation, HME, myMulter } from "../../services/multer.js";
import { endPoints } from "./user.endPoint.js";
import { logInValidation, signUpValidation, updateRoleValidation } from "./user.validation.js";
import * as userControl from './controller/user.controller.js'
import * as userControl1 from './controller/user1.controller.js'
const router = Router()
router.get("/", (req, res) => {
    res.status(200).json({ message: 'user Module' })
})

router.post("/getUserData",auth(), userControl.getUserData)
router.post("/getProfilesData", userControl.getProfilesData)
router.post("/searchUser",auth(), userControl.searchUser)
router.post("/changeUserImage",auth(),myMulter(fileValidation.image).single("image"), HME, userControl.changeUserImage)
router.get("/visited/:_id",auth(), userControl.visited)
router.get("/follow/:_id",auth(), userControl.follow)
router.post("/newCollection",auth(), userControl1.newCollection)
router.post("/savePost",auth(), userControl1.savePost)
router.post("/addToCollection",auth(), userControl1.addToCollection)
router.get("/getPosts",auth(), userControl1.getPostsBasedOnSocialNetwork)
router.get("/getSaved",auth(), userControl1.getSavedAndPosts)
router.get("/allNotificationSeen",auth(), userControl1.allNotificationSeen)
router.post("/bio",auth(), userControl1.bio)
router.delete("/deleteCollection/:id",auth(), userControl1.deleteCollection)
export default router