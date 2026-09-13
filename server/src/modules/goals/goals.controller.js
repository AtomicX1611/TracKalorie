import { goalsService } from './goals.service.js';
export const goalsController = {
    async create(req, res, next) {
        try {
            const goal = await goalsService.createGoal(req.user.id, req.body);
            res.status(201).json({ data: goal });
        }
        catch (err) {
            next(err);
        }
    },
    async getCurrent(req, res, next) {
        try {
            const goal = await goalsService.getCurrentGoal(req.user.id);
            res.status(200).json({ data: goal ?? null });
        }
        catch (err) {
            next(err);
        }
    },
    async getAsOf(req, res, next) {
        try {
            const { asOf } = req.query;
            if (!asOf) {
                res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'asOf query param required' } });
                return;
            }
            const goal = await goalsService.getGoalAsOf(req.user.id, asOf);
            res.status(200).json({ data: goal ?? null });
        }
        catch (err) {
            next(err);
        }
    },
    async getHistory(req, res, next) {
        try {
            const { cursor, limit } = req.query;
            const result = await goalsService.getHistory(req.user.id, cursor, limit ? parseInt(limit, 10) : 20);
            res.status(200).json({
                data: result.goals,
                pagination: { nextCursor: result.nextCursor, hasMore: !!result.nextCursor },
            });
        }
        catch (err) {
            next(err);
        }
    },
};