import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import { validation } from "../../middleware/validation.js";
import { fileValidation, HME, myMulter } from "../../services/multer.js";
import { endPoints } from "./auth.endPoint.js";
import { logInValidation, signUpValidation, updateRoleValidation } from "./auth.validation.js";
import * as registerControl from './controller/registration.js'
const router = Router()
router.get("/", (req, res) => {
    res.status(200).json({ message: 'Auth Module' })
})

router.post("/signUp", registerControl.signUp)
router.post("/logIn", registerControl.logIn)
router.post("/loginWithGoogle", registerControl.loginWithGoogle)
router.post("/loginWithFB", registerControl.loginWithFB)
router.post("/logInWithFbOrGoogle", registerControl.logInWithFbOrGoogle)

export default router