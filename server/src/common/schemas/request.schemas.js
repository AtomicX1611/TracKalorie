import { z } from 'zod';
// ─── Auth request schemas ─────────────────────────────────────────────────────
export const RegisterSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address').toLowerCase(),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(128, 'Password too long'),
    }),
});
export const LoginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address').toLowerCase(),
        password: z.string().min(1, 'Password is required'),
    }),
});
export const RefreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
});
// ─── Goal request schemas ─────────────────────────────────────────────────────
export const CreateGoalSchema = z.object({
    body: z.object({
        dailyCalorieTarget: z.number().min(0).max(10000),
        proteinTargetG: z.number().min(0).max(1000),
        carbTargetG: z.number().min(0).max(2000),
        fatTargetG: z.number().min(0).max(1000),
        weightGoalKg: z.number().min(0).max(500).optional(),
        effectiveFrom: z.string().datetime().optional(), // ISO string; defaults to now
    }),
});
// ─── Meal request schemas ─────────────────────────────────────────────────────
const FoodItemSchema = z.object({
    name: z.string().min(1).max(200).trim(),
    quantity: z.object({
        amount: z.number().min(0),
        unit: z.string().min(1).max(50).trim(),
    }),
    calories: z.number().min(0).max(10000),
    macros: z.object({
        proteinG: z.number().min(0).max(1000),
        carbG: z.number().min(0).max(2000),
        fatG: z.number().min(0).max(1000),
    }),
    micros: z
        .object({
        vitaminA_mcg: z.number().min(0).optional(),
        vitaminC_mg: z.number().min(0).optional(),
        vitaminD_mcg: z.number().min(0).optional(),
        vitaminE_mg: z.number().min(0).optional(),
        vitaminK_mcg: z.number().min(0).optional(),
        thiamin_mg: z.number().min(0).optional(),
        riboflavin_mg: z.number().min(0).optional(),
        niacin_mg: z.number().min(0).optional(),
        vitaminB6_mg: z.number().min(0).optional(),
        vitaminB12_mcg: z.number().min(0).optional(),
        folate_mcg: z.number().min(0).optional(),
        calcium_mg: z.number().min(0).optional(),
        iron_mg: z.number().min(0).optional(),
        magnesium_mg: z.number().min(0).optional(),
        potassium_mg: z.number().min(0).optional(),
        zinc_mg: z.number().min(0).optional(),
        selenium_mcg: z.number().min(0).optional(),
        sodium_mg: z.number().min(0).optional(),
        fiber_g: z.number().min(0).optional(),
        sugar_g: z.number().min(0).optional(),
    })
        .optional(),
});
export const CreateMealSchema = z.object({
    body: z.object({
        mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
        items: z.array(FoodItemSchema).min(1, 'At least one food item is required'),
        source: z.enum(['manual', 'ai_label', 'ai_plate', 'import']).default('manual'),
        aiMeta: z
            .object({
            confidence: z.number().min(0).max(1),
            rawModelResponseId: z.string().optional(),
        })
            .optional(),
    }),
});
export const UpdateMealSchema = z.object({
    params: z.object({ id: z.string().min(1) }),
    body: z.object({
        mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
        items: z.array(FoodItemSchema).min(1).optional(),
    }),
});
export const ListMealsSchema = z.object({
    query: z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
        cursor: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
});
// ─── Nutrition request schemas ────────────────────────────────────────────────
export const DateRangeSchema = z.object({
    query: z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD'),
    }),
});
export const MacrosQuerySchema = z.object({
    query: z.object({
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        granularity: z.enum(['day', 'week']).default('day'),
    }),
});
// ─── AI request schemas ───────────────────────────────────────────────────────
export const AiExtractParamsSchema = z.object({
    query: z.object({
        type: z.enum(['label', 'plate']),
    }),
});
// ─── Users request schemas ────────────────────────────────────────────────────
export const UpdateUserSchema = z.object({
    body: z.object({
        timezone: z.string().max(64).optional(),
    }),
});