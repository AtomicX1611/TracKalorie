export function validate(schema) {
/**
 * Zod validation middleware factory.
 * Takes a schema that validates { body, query, params } and returns a middleware.
 * On failure: passes ZodError to the global error handler → 400 with field details.
 * On success: attaches validated + coerced values back to req.
 *
 * Usage:
 *   router.post('/', validate(CreateMealSchema), mealsController.create);
 */
    return (req, _res, next) => {
        try {
            const result = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            // Attach parsed (coerced, validated) values back to req
            if (result.body !== undefined)
                req.body = result.body;
            if (result.query !== undefined)
                Object.assign(req.query, result.query);
            if (result.params !== undefined)
                Object.assign(req.params, result.params);
            next();
        }
        catch (err) {
            next(err);
        }
    };
}