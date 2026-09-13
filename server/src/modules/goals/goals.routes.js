import { Router } from 'express';
import { goalsController } from './goals.controller.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { CreateGoalSchema } from '../../common/schemas/request.schemas.js';
const router = Router();
export { router as goalsRouter };
// GET /api/v1/goals/current
router.get('/current', goalsController.getCurrent);
// GET /api/v1/goals?asOf=YYYY-MM-DD
router.get('/', goalsController.getAsOf);
// POST /api/v1/goals
router.post('/', validate(CreateGoalSchema), goalsController.create);
// GET /api/v1/goals/history
router.get('/history', goalsController.getHistory);