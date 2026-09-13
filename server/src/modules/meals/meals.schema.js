import { Schema, model } from 'mongoose';
// ─── Sub-document schemas ─────────────────────────────────────────────────────
const MicrosSchema = new Schema({
    vitaminA_mcg: Number,
    vitaminC_mg: Number,
    calcium_mg: Number,
    iron_mg: Number,
    sodium_mg: Number,
    fiber_g: Number,
    sugar_g: Number,
}, { _id: false });
const MacrosSchema = new Schema({
    proteinG: { type: Number, required: true, min: 0 },
    carbG: { type: Number, required: true, min: 0 },
    fatG: { type: Number, required: true, min: 0 },
}, { _id: false });
const FoodItemSchema = new Schema({
    name: { type: String, required: true, trim: true },
    quantity: {
        amount: { type: Number, required: true, min: 0 },
        unit: { type: String, required: true, trim: true },
    },
    calories: { type: Number, required: true, min: 0 },
    macros: { type: MacrosSchema, required: true },
    micros: { type: MicrosSchema },
}, { _id: false });
const TotalsSchema = new Schema({
    calories: { type: Number, required: true },
    proteinG: { type: Number, required: true },
    carbG: { type: Number, required: true },
    fatG: { type: Number, required: true },
}, { _id: false });
// ─── Meal schema ─────────────────────────────────────────────────────────────
const MealSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: true,
    },
    date: { type: Date, required: true },
    loggedAt: { type: Date, required: true, default: () => new Date() },
    items: { type: [FoodItemSchema], required: true },
    totals: { type: TotalsSchema, required: true },
    source: {
        type: String,
        enum: ['manual', 'ai_label', 'ai_plate', 'import'],
        default: 'manual',
    },
    aiMeta: {
        confidence: Number,
        rawModelResponseId: String,
    },
}, { timestamps: true });
// ─── Indexes ─────────────────────────────────────────────────────────────────
// Primary query: user's meals in a date range, newest first
MealSchema.index({ userId: 1, date: -1 });
// Filtered listing (by meal type)
MealSchema.index({ userId: 1, date: -1, mealType: 1 });
export const MealModel = model('Meal', MealSchema);