import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';


export function singleTenantMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  req.user = { id: config.singleTenant.userId };
  next();
}
declare global {
  namespace Express {
    interface Request {
      user: { id: string };
      timezone: string; 
    }
  }
}
