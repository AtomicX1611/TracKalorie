import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';


export function singleTenantMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  req.user = { id: config.singleTenant.userId, email: 'tenant@local' };
  next();
}
