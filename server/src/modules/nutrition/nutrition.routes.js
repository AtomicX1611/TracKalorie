import { Router } from 'express';
import { nutritionController } from './nutrition.controller.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { DateRangeSchema, MacrosQuerySchema } from '../../common/schemas/request.schemas.js';
const router = Router();
export { router as nutritionRouter };
// GET /api/v1/nutrition/trend/weekly?from=&to=
router.get('/trend/weekly', validate(DateRangeSchema), nutritionController.weeklyTrend);
// GET /api/v1/nutrition/macros?granularity=day|week&from=&to=
router.get('/macros', validate(MacrosQuerySchema), nutritionController.macroBreakdown);
// GET /api/v1/nutrition/micros/summary?from=&to=
router.get('/micros/summary', validate(DateRangeSchema), nutritionController.microSummary);
// GET /api/v1/nutrition/goal-vs-actual?from=&to=
router.get('/goal-vs-actual', validate(DateRangeSchema), nutritionController.goalVsActual);