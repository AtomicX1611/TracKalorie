import { mealsService } from './meals.service.js';
export const mealsController = {
    async create(req, res, next) {
        try {
            const meal = await mealsService.createMeal(req.user.id, {
                ...req.body,
                timezone: req.timezone,
            });
            res.status(201).json({ data: meal });
        }
        catch (err) {
            next(err);
        }
    },
    async list(req, res, next) {
        try {
            const query = req.query;
            const { from, to, mealType, cursor, limit } = query;
            const result = await mealsService.listMeals(req.user.id, {
                from,
                to,
                mealType: mealType,
                cursor,
                limit: limit ? parseInt(limit, 10) : 20,
            });
            res.status(200).json({
                data: result.meals,
                pagination: { nextCursor: result.nextCursor, hasMore: !!result.nextCursor },
            });
        }
        catch (err) {
            next(err);
        }
    },
    async getOne(req, res, next) {
        try {
            const meal = await mealsService.getMeal(req.user.id, String(req.params.id));
            res.status(200).json({ data: meal });
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            const meal = await mealsService.updateMeal(req.user.id, String(req.params.id), {
                ...req.body,
                timezone: req.timezone,
            });
            res.status(200).json({ data: meal });
        }
        catch (err) {
            next(err);
        }
    },
    async remove(req, res, next) {
        try {
            await mealsService.deleteMeal(req.user.id, String(req.params.id));
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    },
};