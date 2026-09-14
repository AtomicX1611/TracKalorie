import { Router } from 'express';
import { chatController } from './chat.controller.js';
import rateLimit from 'express-rate-limit';

const router = Router();
export { router as chatRouter };

// Rate-limit chat endpoint: LLM calls are expensive.
// 30 requests per minute per IP is generous for conversational use.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many chat requests — please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/v1/chat
router.post('/', chatLimiter, chatController.sendMessage);
