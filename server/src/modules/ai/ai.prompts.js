/**
 * OpenAI structured output schemas for AI extraction.
 *
 * Two distinct schemas because label vs plate have fundamentally different
 * extraction tasks and different confidence models:
 *
 * LABEL: text-reading task (OCR-adjacent) → high confidence threshold (≥0.85)
 * PLATE: visual estimation → confidence hard-capped at "medium" regardless of model claim
 *
 * Using response_format: { type: "json_schema" } (structured outputs mode)
 * instead of parsing free text — eliminates regex parsing, guarantees shape.
 */
export const LABEL_EXTRACTION_SCHEMA = {
    name: 'nutrition_label_extraction',
    strict: true,
    schema: {
        type: 'object',
        properties: {
            foodName: { type: 'string', description: 'Name of the food product' },
            servingSize: { type: 'string', description: 'Serving size description (e.g. "1 cup (240g)")' },
            servingGrams: { type: ['number', 'null'], description: 'Serving weight in grams, extracted from the label when shown' },
            servingsPerContainer: { type: ['number', 'null'], description: 'Number of servings per container, null if not shown' },
            calories: { type: 'number', description: 'Calories per serving' },
            proteinG: { type: 'number', description: 'Protein in grams per serving' },
            carbG: { type: 'number', description: 'Total carbohydrates in grams per serving' },
            fatG: { type: 'number', description: 'Total fat in grams per serving' },
            micros: {
                type: 'object',
                properties: {
                    vitaminA_mcg: { type: ['number', 'null'] },
                    vitaminC_mg: { type: ['number', 'null'] },
                    vitaminD_mcg: { type: ['number', 'null'] },
                    vitaminE_mg: { type: ['number', 'null'] },
                    vitaminK_mcg: { type: ['number', 'null'] },
                    thiamin_mg: { type: ['number', 'null'] },
                    riboflavin_mg: { type: ['number', 'null'] },
                    niacin_mg: { type: ['number', 'null'] },
                    vitaminB6_mg: { type: ['number', 'null'] },
                    vitaminB12_mcg: { type: ['number', 'null'] },
                    folate_mcg: { type: ['number', 'null'] },
                    calcium_mg: { type: ['number', 'null'] },
                    iron_mg: { type: ['number', 'null'] },
                    magnesium_mg: { type: ['number', 'null'] },
                    potassium_mg: { type: ['number', 'null'] },
                    zinc_mg: { type: ['number', 'null'] },
                    selenium_mcg: { type: ['number', 'null'] },
                    sodium_mg: { type: ['number', 'null'] },
                    fiber_g: { type: ['number', 'null'] },
                    sugar_g: { type: ['number', 'null'] },
                },
                required: ['vitaminA_mcg', 'vitaminC_mg', 'vitaminD_mcg', 'vitaminE_mg', 'vitaminK_mcg', 'thiamin_mg', 'riboflavin_mg', 'niacin_mg', 'vitaminB6_mg', 'vitaminB12_mcg', 'folate_mcg', 'calcium_mg', 'iron_mg', 'magnesium_mg', 'potassium_mg', 'zinc_mg', 'selenium_mcg', 'sodium_mg', 'fiber_g', 'sugar_g'],
                additionalProperties: false,
            },
            confidence: {
                type: 'number',
                description: 'Your confidence 0.0-1.0 that the extraction is accurate',
            },
        },
        required: ['foodName', 'servingSize', 'servingGrams', 'servingsPerContainer', 'calories', 'proteinG', 'carbG', 'fatG', 'micros', 'confidence'],
        additionalProperties: false,
    },
};
export const PLATE_EXTRACTION_SCHEMA = {
    name: 'plate_food_estimation',
    strict: true,
    schema: {
        type: 'object',
        properties: {
            items: {
                type: 'array',
                description: 'Individual food items visible in the image',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        estimatedQuantity: { type: 'string', description: 'e.g. "1 cup", "200g", "1 medium piece"' },
                        calories: { type: 'number' },
                        proteinG: { type: 'number' },
                        carbG: { type: 'number' },
                        fatG: { type: 'number' },
                    },
                    required: ['name', 'estimatedQuantity', 'calories', 'proteinG', 'carbG', 'fatG'],
                    additionalProperties: false,
                },
            },
            overallConfidence: {
                type: 'number',
                description: 'Your overall confidence 0.0-1.0 in the estimation',
            },
            notes: {
                type: 'string',
                description: 'Any caveats about the estimation (portion sizes, hidden ingredients, etc.)',
            },
        },
        required: ['items', 'overallConfidence', 'notes'],
        additionalProperties: false,
    },
};
export const LABEL_SYSTEM_PROMPT = `You are a deterministic nutrition label OCR reader. Read only values that are visibly printed on the nutrition label; never guess, substitute a typical value, or use outside product knowledge. Preserve the label's serving basis and units. If any value is unreadable or absent, use null where the schema permits it. Return the same values when the same image is submitted. Report confidence honestly.`;
export const PLATE_SYSTEM_PROMPT = `You are a consistent food portion estimator. Identify only food items clearly visible in the image. Use standard USDA-style reference portions and round estimates to practical whole numbers or one decimal place; do not invent hidden ingredients or precision. Apply the same assumptions each time the same image is submitted. Be transparent about uncertainty and never claim high confidence for plate estimations.`;