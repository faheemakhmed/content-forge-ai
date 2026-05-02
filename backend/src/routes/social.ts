import { Router } from 'express';
import {
  twitterAuth,
  twitterCallback,
  linkedinAuth,
  linkedinCallback,
  getAccounts,
  deleteAccount,
} from '../controllers/socialController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/twitter', authenticate, twitterAuth);
router.get('/twitter/callback', twitterCallback);
router.get('/linkedin', authenticate, linkedinAuth);
router.get('/linkedin/callback', linkedinCallback);

router.get('/accounts', authenticate, getAccounts);
router.delete('/accounts/:id', authenticate, deleteAccount);

export default router;