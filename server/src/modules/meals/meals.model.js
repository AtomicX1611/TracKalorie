import mongoose from 'mongoose';

// ── Sub-document schemas ──────────────────────────────────────────────────────

const MicrosSchema = new mongoose.Schema(
  {
    vitaminA_mcg: Number,
    vitaminC_mg:  Number,
    calcium_mg:   Number,
    iron_mg:      Number,
    sodium_mg:    Number,
    fiber_g:      Number,
    sugar_g:      Number,
  },
  { _id: false }
);

const MacrosSchema = new mongoose.Schema(
  {
    proteinG: { type: Number, required: true, min: 0 },
    carbG:    { type: Number, required: true, min: 0 },
    fatG:     { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const FoodItemSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    quantity: {
      amount: { type: Number, required: true, min: 0 },
      unit:   { type: String, required: true, trim: true },
    },
    calories: { type: Number, required: true, min: 0 },
    macros:   { type: MacrosSchema, required: true },
    micros:   MicrosSchema,
  },
  { _id: false }
);

const TotalsSchema = new mongoose.Schema(
  {
    calories: { type: Number, required: true },
    proteinG: { type: Number, required: true },
    carbG:    { type: Number, required: true },
    fatG:     { type: Number, required: true },
  },
  { _id: false }
);

// ── Meal schema ───────────────────────────────────────────────────────────────

const MealSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
    date:     { type: Date, required: true },     // UTC midnight of user's local calendar day
    loggedAt: { type: Date, required: true, default: () => new Date() }, // Actual log timestamp
    items:    { type: [FoodItemSchema], required: true },
    totals:   { type: TotalsSchema, required: true }, // Denormalized, server-computed on every write
    source:   { type: String, enum: ['manual', 'ai_label', 'ai_plate', 'import'], default: 'manual' },
    aiMeta: {
      confidence:         Number,
      rawModelResponseId: String,
    },
  },
  {
    timestamps: true,
    toJSON: { transform: (_d, ret) => { delete ret.__v; return ret; } },
  }
);

// Primary query: user's meals in a date range, newest first
MealSchema.index({ userId: 1, date: -1 });
// Filtered listing (by meal type)
MealSchema.index({ userId: 1, date: -1, mealType: 1 });

export const MealModel = mongoose.model('Meal', MealSchema);
