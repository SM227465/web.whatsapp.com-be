import express from 'express';
import trimRequest from 'trim-request';
import { login, refreshToken, register } from '../controllers/auth.controller.js';

const router = express.Router();

router.use(trimRequest.all);

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

export default router;
