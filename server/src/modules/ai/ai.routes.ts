import { Router } from 'express';
import multer from 'multer';
import { aiController } from './ai.controller';

// Use memory storage — we only need the buffer to pass to OpenAI, no disk write
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB — enforced again in controller for clear error message
  },
});

const router = Router();

// POST /api/v1/ai/extract?type=label|plate
router.post('/extract', upload.single('image'), aiController.extract);

export { router as aiRouter };
