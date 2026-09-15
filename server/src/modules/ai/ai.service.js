import OpenAI from 'openai';
import { z } from 'zod';
import { config } from '../../common/config/config.js';
import { AppError } from '../../common/middleware/errorHandler.middleware.js';
import { LABEL_EXTRACTION_SCHEMA, PLATE_EXTRACTION_SCHEMA, LABEL_SYSTEM_PROMPT, PLATE_SYSTEM_PROMPT } from './ai.prompts.js';
// ─── OpenAI client singleton ──────────────────────────────────────────────────
let _openaiClient = null;
function getOpenAI() {
    if (!_openaiClient) {
        if (!config.openai.apiKey) {
            throw new AppError(503, 'AI_NOT_CONFIGURED', 'OpenAI API key is not configured');
        }
        _openaiClient = new OpenAI({ apiKey: config.openai.apiKey });
    }
    return _openaiClient;
}
// ─── Zod schemas for AI response validation ───────────────────────────────────
const LabelResponseSchema = z.object({
    foodName: z.string().min(1),
    servingSize: z.string(),
    servingGrams: z.number().positive().nullable(),
    servingsPerContainer: z.number().nullable(),
    calories: z.number().min(0),
    proteinG: z.number().min(0),
    carbG: z.number().min(0),
    fatG: z.number().min(0),
    micros: z.object({
        vitaminA_mcg: z.number().nullable(),
        vitaminC_mg: z.number().nullable(),
        vitaminD_mcg: z.number().nullable(),
        vitaminE_mg: z.number().nullable(),
        vitaminK_mcg: z.number().nullable(),
        thiamin_mg: z.number().nullable(),
        riboflavin_mg: z.number().nullable(),
        niacin_mg: z.number().nullable(),
        vitaminB6_mg: z.number().nullable(),
        vitaminB12_mcg: z.number().nullable(),
        folate_mcg: z.number().nullable(),
        calcium_mg: z.number().nullable(),
        iron_mg: z.number().nullable(),
        magnesium_mg: z.number().nullable(),
        potassium_mg: z.number().nullable(),
        zinc_mg: z.number().nullable(),
        selenium_mcg: z.number().nullable(),
        sodium_mg: z.number().nullable(),
        fiber_g: z.number().nullable(),
        sugar_g: z.number().nullable(),
    }),
    confidence: z.number().min(0).max(1),
});
const PlateItemSchema = z.object({
    name: z.string().min(1),
    estimatedQuantity: z.string(),
    calories: z.number().min(0),
    proteinG: z.number().min(0),
    carbG: z.number().min(0),
    fatG: z.number().min(0),
});
const PlateResponseSchema = z.object({
    items: z.array(PlateItemSchema).min(1),
    overallConfidence: z.number().min(0).max(1),
    notes: z.string(),
});
// ─── Business validation helpers ─────────────────────────────────────────────
/**
 * Cross-checks: calories should roughly equal protein*4 + carb*4 + fat*9.
 * We allow a 25% tolerance (nutrition labels round values).
 * A failed check downgrades confidence and adds a warning — it does NOT fail the request.
 */
function validateCalorieMacroConsistency(calories, proteinG, carbG, fatG) {
    const expected = proteinG * 4 + carbG * 4 + fatG * 9;
    if (expected === 0)
        return null;
    const diff = Math.abs(calories - expected) / expected;
    if (diff > 0.25) {
        return `Calories (${calories}) don't match expected ${Math.round(expected)} from macros (protein×4 + carb×4 + fat×9). Please verify.`;
    }
    return null;
}
export const aiService = {
    async extractFromImage(imageBuffer, mimeType, extractionType) {
        const openai = getOpenAI();
        const base64Image = imageBuffer.toString('base64');
        const imageUrl = `data:${mimeType};base64,${base64Image}`;
        const schema = extractionType === 'label' ? LABEL_EXTRACTION_SCHEMA : PLATE_EXTRACTION_SCHEMA;
        const systemPrompt = extractionType === 'label' ? LABEL_SYSTEM_PROMPT : PLATE_SYSTEM_PROMPT;
        let rawResponse;
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: [
                            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
                            {
                                type: 'text',
                                text: extractionType === 'label'
                                    ? 'Extract all nutritional information from this nutrition label.'
                                    : 'Identify all food items and estimate their nutritional content.',
                            },
                        ],
                    },
                ],
                temperature: 0,
                seed: 42,
                response_format: {
                    type: 'json_schema',
                    json_schema: schema,
                },
                max_tokens: 1024,
            });
            rawResponse = response.choices[0]?.message?.content ?? '';
        }
        catch (err) {
            throw new AppError(502, 'AI_PROVIDER_UNAVAILABLE', 'AI provider request failed');
        }
        // ─── Schema validation (Zod) ─────────────────────────────────────────────
        let parsed;
        try {
            parsed = JSON.parse(rawResponse);
        }
        catch {
            throw new AppError(502, 'AI_PROVIDER_UNAVAILABLE', 'AI provider returned malformed JSON');
        }
        if (extractionType === 'label') {
            const result = LabelResponseSchema.safeParse(parsed);
            if (!result.success) {
                throw new AppError(502, 'AI_PROVIDER_UNAVAILABLE', 'AI response did not match expected schema');
            }
            const warnings = [];
            let confidence = result.data.confidence;
            // ─── Business validation ───────────────────────────────────────────────
            const consistencyWarning = validateCalorieMacroConsistency(result.data.calories, result.data.proteinG, result.data.carbG, result.data.fatG);
            if (consistencyWarning) {
                warnings.push(consistencyWarning);
                confidence = Math.min(confidence, 0.6); // Downgrade on inconsistency
            }
            // Sane range checks
            if (result.data.calories > 2000)
                warnings.push('Calorie value is unusually high for a single serving — please verify.');
            if (result.data.proteinG > 200)
                warnings.push('Protein value is unusually high — please verify.');
            return {
                type: 'label',
                draft: result.data,
                confidence: confidence >= 0.85 ? 'high' : confidence >= 0.6 ? 'medium' : 'low',
                confidenceScore: confidence,
                warnings,
            };
        }
        else {
            const result = PlateResponseSchema.safeParse(parsed);
            if (!result.success) {
                throw new AppError(502, 'AI_PROVIDER_UNAVAILABLE', 'AI response did not match expected schema');
            }
            const warnings = [
                'Plate estimations are visual approximations. Portion sizes may vary — please review and adjust.'
            ];
            if (result.data.notes)
                warnings.push(result.data.notes);
            // HARD CAP: plate confidence never shows as "high" — see AD-008
            // Even if model claims 0.95, plate estimation is inherently imprecise
            const cappedScore = Math.min(result.data.overallConfidence, 0.74);
            return {
                type: 'plate',
                draft: result.data.items,
                confidence: 'medium', // Always medium for plate, regardless of model claim
                confidenceScore: cappedScore,
                warnings,
            };
        }
    },
};