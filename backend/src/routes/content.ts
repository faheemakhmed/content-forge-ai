import { Router } from 'express';
import {
  generateContentHandler,
  postContent,
  scheduleContent,
  getContent,
  updateContent,
  deleteContent,
} from '../controllers/contentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/generate', authenticate, generateContentHandler);
router.post('/post', authenticate, postContent);
router.post('/schedule', authenticate, scheduleContent);
router.get('/', authenticate, getContent);
router.put('/:id', authenticate, updateContent);
router.delete('/:id', authenticate, deleteContent);

export default router;