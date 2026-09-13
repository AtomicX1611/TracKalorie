import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    } satisfies ApiErrorBody);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    } satisfies ApiErrorBody);
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  } satisfies ApiErrorBody);
}

export const Errors = {
  notFound: (resource: string) =>
    new AppError(404, 'NOT_FOUND', `${resource} not found`),

  badRequest: (message: string, details?: unknown[]) =>
    new AppError(400, 'BAD_REQUEST', message, details),

  unauthorized: () =>
    new AppError(401, 'UNAUTHORIZED', 'Authentication required'),

  forbidden: () =>
    new AppError(403, 'FORBIDDEN', 'Access denied'),

  conflict: (message: string) =>
    new AppError(409, 'CONFLICT', message),

  tooManyRequests: (message = 'Rate limit exceeded') =>
    new AppError(429, 'RATE_LIMIT_EXCEEDED', message),

  aiProviderUnavailable: () =>
    new AppError(502, 'AI_PROVIDER_UNAVAILABLE', 'AI provider is currently unavailable'),

  serviceUnavailable: () =>
    new AppError(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable'),
};
