import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { fileValidation, HME, myMulter } from '../../services/multer.js';
import * as controller from './story.controller.js';

const router = Router();
router.get('/', (req, res) => res.json({ success: true, message: 'Stories module' }));
router.post('/addStory', auth(), myMulter(fileValidation.all).single('story'), HME, controller.addStory);
export default router;
