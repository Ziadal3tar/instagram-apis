import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { fileValidation, HME, myMulter } from '../../services/multer.js';
import * as controller from './reel.controller.js';

const router = Router();
router.get('/', (req, res) => res.json({ success: true, message: 'Reels module' }));
router.post('/addReel', auth(), myMulter(fileValidation.video).single('reel'), HME, controller.addReel);
router.get('/getAllReels', auth(), controller.getAllReels);

export default router;
