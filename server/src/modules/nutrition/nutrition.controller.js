import { nutritionService } from './nutrition.service.js';
export const nutritionController = {
    async weeklyTrend(req, res, next) {
        try {
            const { from, to } = req.query;
            const data = await nutritionService.getWeeklyTrend(req.user.id, from, to, req.timezone);
            res.status(200).json({ data });
        }
        catch (err) {
            next(err);
        }
    },
    async macroBreakdown(req, res, next) {
        try {
            const { from, to, granularity } = req.query;
            const data = await nutritionService.getMacroBreakdown(req.user.id, from, to, req.timezone, granularity ?? 'day');
            res.status(200).json({ data });
        }
        catch (err) {
            next(err);
        }
    },
    async microSummary(req, res, next) {
        try {
            const { from, to } = req.query;
            const data = await nutritionService.getMicroSummary(req.user.id, from, to);
            res.status(200).json({ data });
        }
        catch (err) {
            next(err);
        }
    },
    async goalVsActual(req, res, next) {
        try {
            const { from, to } = req.query;
            const data = await nutritionService.getGoalVsActual(req.user.id, from, to, req.timezone);
            res.status(200).json({ data });
        }
        catch (err) {
            next(err);
        }
    },
};