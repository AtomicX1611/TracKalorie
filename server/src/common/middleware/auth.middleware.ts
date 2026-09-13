import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { Errors, AppError } from './errorHandler.middleware';

interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * JWT Auth Middleware
 *
 * Verifies the Bearer token in the Authorization header.
 * On success: attaches req.user = { id: userId, email } — identical interface
 * to the old singleTenant middleware so no service/repo code changes.
 * On failure: passes an AppError(401) to the global error handler.
 *
 * Usage: applied globally in app.ts (all routes after /auth are protected).
 * The /auth routes (register/login/refresh) are registered BEFORE this middleware.
 */
export function verifyJwt(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(Errors.unauthorized());
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'TOKEN_EXPIRED', 'Access token has expired'));
    }
    return next(Errors.unauthorized());
  }
}

// ─── Token generation helpers ─────────────────────────────────────────────────

export function signAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    config.jwt.secret,
    // jsonwebtoken types require explicit cast for expiresIn
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
}
