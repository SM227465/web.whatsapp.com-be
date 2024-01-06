import express from 'express';
import trimRequest from 'trim-request';
import { login, refreshToken, register, protect } from '../controllers/auth.controller.js';
import {
  createOpenConversation,
  getConversations,
} from '../controllers/conversation.controller.js';

const router = express.Router();

router.use(trimRequest.all);
router.use(protect);

router.post('/', createOpenConversation);
router.get('/', getConversations);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

export default router;

/*
import express from "express";
import trimRequest from "trim-request";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createGroup,
  create_open_conversation,
  getConversations,
} from "../controllers/conversation.controller.js";
const router = express.Router();

router
  .route("/")
  .post(trimRequest.all, authMiddleware, create_open_conversation);
router.route("/").get(trimRequest.all, authMiddleware, getConversations);
router.route("/group").post(trimRequest.all, authMiddleware, createGroup);

export default router;

*/
