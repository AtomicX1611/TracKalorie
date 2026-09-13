import { Router } from 'express';
import { nutritionController } from './nutrition.controller';
import { validate } from '../../common/middleware/validate.middleware';
import { DateRangeSchema, MacrosQuerySchema } from '../../common/schemas/request.schemas';

const router = Router();

// GET /api/v1/nutrition/trend/weekly?from=&to=
router.get('/trend/weekly', validate(DateRangeSchema), nutritionController.weeklyTrend);

// GET /api/v1/nutrition/macros?granularity=day|week&from=&to=
router.get('/macros', validate(MacrosQuerySchema), nutritionController.macroBreakdown);

// GET /api/v1/nutrition/micros/summary?from=&to=
router.get('/micros/summary', validate(DateRangeSchema), nutritionController.microSummary);

// GET /api/v1/nutrition/goal-vs-actual?from=&to=
router.get('/goal-vs-actual', validate(DateRangeSchema), nutritionController.goalVsActual);

export { router as nutritionRouter };
