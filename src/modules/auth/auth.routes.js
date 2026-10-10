import { Router } from 'express';
import { validation } from '../../middleware/validation.js';
import * as controller from './auth.controller.js';
import { loginSchema, signUpSchema, socialLoginSchema } from './auth.validation.js';

const router = Router();

router.get('/', (req, res) => res.json({ success: true, message: 'Auth module' }));
router.post('/signUp', validation(signUpSchema), controller.signUp);
router.post('/logIn', validation(loginSchema), controller.logIn);
router.post('/loginWithGoogle', validation(socialLoginSchema), controller.loginWithGoogle);
router.post('/loginWithFB', validation(socialLoginSchema), controller.loginWithFB);
router.post('/logInWithFbOrGoogle', validation(socialLoginSchema), controller.logInWithFbOrGoogle);

export default router;
