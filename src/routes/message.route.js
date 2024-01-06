import express from 'express';
import trimRequest from 'trim-request';
import { protect } from '../controllers/auth.controller.js';
import { getMessages, sendMessage } from '../controllers/message.controller.js';

const router = express.Router();

router.use(trimRequest.all);
router.use(protect);

router.post('/', sendMessage);
router.get('/:conversationId', getMessages);
export default router;
