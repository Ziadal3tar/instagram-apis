import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validation } from '../../middleware/validation.js';
import { fileValidation, HME, myMulter } from '../../services/multer.js';
import * as controller from './post.controller.js';
import { commentSchema, interactionSchema, postIdSchema } from './post.validation.js';

const router = Router();
router.get('/', (req, res) => res.json({ success: true, message: 'Posts module' }));
router.post('/addPost', auth(), myMulter(fileValidation.all).any(), HME, controller.addPost);
router.post('/like', auth(), validation(interactionSchema), controller.like);
router.post('/addComment', auth(), validation(commentSchema), controller.addComment);
router.post('/getPostById', auth(), validation(postIdSchema), controller.getPostById);
router.get('/explore', auth(), controller.explore);


export default router;
