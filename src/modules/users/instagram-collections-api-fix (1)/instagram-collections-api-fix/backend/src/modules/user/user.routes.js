import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import { validation } from '../../middleware/validation.js';
import { fileValidation, HME, myMulter } from '../../services/multer.js';
import * as controller from './user.controller.js';
import {
  bioSchema,
  collectionIdSchema,
  collectionItemParamsSchema,
  collectionItemsSchema,
  collectionParamsSchema,
  collectionSchema,
  profileSchema,
  saveSchema,
  searchSchema,
  userIdSchema,
} from './user.validation.js';

const router = Router();

router.get('/', (req, res) => res.json({ success: true, message: 'User module' }));
router.post('/getUserData', auth(), controller.getUserData);
router.post('/getProfilesData', auth(), validation(profileSchema), controller.getProfilesData);
router.post('/searchUser', auth(), validation(searchSchema), controller.searchUser);
router.post('/changeUserImage', auth(), myMulter(fileValidation.image).single('image'), HME, controller.changeUserImage);
router.get('/visited/:_id', auth(), validation(userIdSchema), controller.visited);
router.get('/follow/:_id', auth(), validation(userIdSchema), controller.follow);
router.post('/newCollection', auth(), validation(collectionSchema), controller.createCollection);
router.post('/savePost', auth(), validation(saveSchema), controller.toggleSave);
router.post('/addToCollection', auth(), validation(collectionItemsSchema), controller.addToCollection);
router.get('/collections/:collectionId/items', auth(), validation(collectionParamsSchema), controller.getCollectionItems);
router.get('/getSaved', auth(), controller.getSaved);
router.get('/allNotificationSeen', auth(), controller.allNotificationSeen);
router.post('/bio', auth(), validation(bioSchema), controller.bio);
router.delete('/deleteCollection/:id', auth(), validation(collectionIdSchema), controller.deleteCollection);
router.delete('/collections/:collectionId/items/:itemId', auth(), validation(collectionItemParamsSchema), controller.removeFromCollection);

export default router;
