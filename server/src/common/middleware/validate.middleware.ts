import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Zod validation middleware factory.
 * Takes a schema that validates { body, query, params } and returns a middleware.
 * On failure: passes ZodError to the global error handler → 400 with field details.
 * On success: attaches validated + coerced values back to req.
 *
 * Usage:
 *   router.post('/', validate(CreateMealSchema), mealsController.create);
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: unknown; query?: unknown; params?: unknown };
      // Attach parsed (coerced, validated) values back to req
      if (result.body !== undefined) req.body = result.body;
      if (result.query !== undefined) Object.assign(req.query, result.query as object);
      if (result.params !== undefined) Object.assign(req.params, result.params as object);
      next();
    } catch (err) {
      next(err);
    }
  };
}
