import { ZodError } from 'zod';
export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
export function errorHandler(err, _req, res, _next) {
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
        });
        return;
    }
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
            },
        });
        return;
    }
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
        },
    });
}
export const Errors = {
    notFound: (resource) => new AppError(404, 'NOT_FOUND', `${resource} not found`),
    badRequest: (message, details) => new AppError(400, 'BAD_REQUEST', message, details),
    unauthorized: () => new AppError(401, 'UNAUTHORIZED', 'Authentication required'),
    forbidden: () => new AppError(403, 'FORBIDDEN', 'Access denied'),
    conflict: (message) => new AppError(409, 'CONFLICT', message),
    tooManyRequests: (message = 'Rate limit exceeded') => new AppError(429, 'RATE_LIMIT_EXCEEDED', message),
    aiProviderUnavailable: () => new AppError(502, 'AI_PROVIDER_UNAVAILABLE', 'AI provider is currently unavailable'),
    serviceUnavailable: () => new AppError(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable'),
};