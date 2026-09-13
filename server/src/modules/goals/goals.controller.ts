import { Request, Response, NextFunction } from 'express';
import { goalsService } from './goals.service';

export const goalsController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const goal = await goalsService.createGoal(req.user.id, req.body);
      res.status(201).json({ data: goal });
    } catch (err) {
      next(err);
    }
  },

  async getCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const goal = await goalsService.getCurrentGoal(req.user.id);
      res.status(200).json({ data: goal ?? null });
    } catch (err) {
      next(err);
    }
  },

  async getAsOf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { asOf } = req.query as { asOf?: string };
      if (!asOf) {
        res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'asOf query param required' } });
        return;
      }
      const goal = await goalsService.getGoalAsOf(req.user.id, asOf);
      res.status(200).json({ data: goal ?? null });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cursor, limit } = req.query as { cursor?: string; limit?: string };
      const result = await goalsService.getHistory(
        req.user.id,
        cursor,
        limit ? parseInt(limit, 10) : 20
      );
      res.status(200).json({
        data: result.goals,
        pagination: { nextCursor: result.nextCursor, hasMore: !!result.nextCursor },
      });
    } catch (err) {
      next(err);
    }
  },
};
