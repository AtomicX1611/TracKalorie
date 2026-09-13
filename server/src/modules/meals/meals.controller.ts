import { Request, Response, NextFunction } from 'express';
import { mealsService } from './meals.service';
import { MealType } from './meals.schema';

export const mealsController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meal = await mealsService.createMeal(req.user.id, {
        ...req.body,
        timezone: req.timezone,
      });
      res.status(201).json({ data: meal });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as Record<string, string | undefined>;
      const { from, to, mealType, cursor, limit } = query;
      const result = await mealsService.listMeals(req.user.id, {
        from,
        to,
        mealType: mealType as MealType | undefined,
        cursor,
        limit: limit ? parseInt(limit, 10) : 20,
      });
      res.status(200).json({
        data: result.meals,
        pagination: { nextCursor: result.nextCursor, hasMore: !!result.nextCursor },
      });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meal = await mealsService.getMeal(req.user.id, String(req.params.id));
      res.status(200).json({ data: meal });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meal = await mealsService.updateMeal(req.user.id, String(req.params.id), req.body);
      res.status(200).json({ data: meal });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await mealsService.deleteMeal(req.user.id, String(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
