import { Request, Response, NextFunction } from 'express';
import { nutritionService } from './nutrition.service';

export const nutritionController = {
  async weeklyTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from: string; to: string };
      const data = await nutritionService.getWeeklyTrend(
        req.user.id, from, to, req.timezone
      );
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async macroBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to, granularity } = req.query as {
        from: string;
        to: string;
        granularity?: 'day' | 'week';
      };
      const data = await nutritionService.getMacroBreakdown(
        req.user.id, from, to, req.timezone, granularity ?? 'day'
      );
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async microSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from: string; to: string };
      const data = await nutritionService.getMicroSummary(req.user.id, from, to);
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async goalVsActual(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from: string; to: string };
      const data = await nutritionService.getGoalVsActual(
        req.user.id, from, to, req.timezone
      );
      res.status(200).json({ data });
    } catch (err) {
      next(err);
    }
  },
};
