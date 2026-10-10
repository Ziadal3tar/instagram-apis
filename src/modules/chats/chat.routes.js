import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validation } from '../../middleware/validation.js';
import * as controller from './chat.controller.js';
import { chatUserSchema, sendMessageSchema } from './chat.validation.js';

const router = Router();
router.get('/', (req, res) => res.json({ success: true, message: 'Chats module' }));
router.post('/sendMessage', auth(), validation(sendMessageSchema), controller.sendMessage);
router.get('/getChat', auth(), validation(chatUserSchema), controller.getChat);
router.post('/getChat', auth(), validation(chatUserSchema), controller.getChat); // legacy compatibility
export default router;
