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
          calcium_mg: { type: ['number', 'null'] },
          iron_mg: { type: ['number', 'null'] },
          sodium_mg: { type: ['number', 'null'] },
          fiber_g: { type: ['number', 'null'] },
          sugar_g: { type: ['number', 'null'] },
        },
        required: ['vitaminA_mcg', 'vitaminC_mg', 'calcium_mg', 'iron_mg', 'sodium_mg', 'fiber_g', 'sugar_g'],
        additionalProperties: false,
      },
      confidence: {
        type: 'number',
        description: 'Your confidence 0.0-1.0 that the extraction is accurate',
      },
    },
    required: ['foodName', 'servingSize', 'servingsPerContainer', 'calories', 'proteinG', 'carbG', 'fatG', 'micros', 'confidence'],
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

export const LABEL_SYSTEM_PROMPT = `You are a nutrition label reader. Extract all nutritional information from the image of a nutrition facts label. Be precise — this is an OCR task. If a value is not visible or not present on the label, use null. Report your confidence honestly.`;

export const PLATE_SYSTEM_PROMPT = `You are a food portion estimator. Identify all food items visible in the image and estimate their nutritional content based on typical serving sizes and visual portion assessment. Be transparent about uncertainty — these are estimates, not precise measurements. Do not claim high confidence for plate estimations.`;
