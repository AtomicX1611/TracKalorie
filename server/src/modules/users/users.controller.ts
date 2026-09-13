import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';

export const usersController = {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getProfile(req.user.id);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { timezone } = req.body;
      if (!timezone) {
        res.status(200).json({ data: await usersService.getProfile(req.user.id) });
        return;
      }
      const user = await usersService.updateTimezone(req.user.id, timezone);
      res.status(200).json({ data: user });
    } catch (err) {
      next(err);
    }
  },
};
