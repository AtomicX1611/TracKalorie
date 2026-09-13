import mongoose, { Schema, Document, Types } from 'mongoose';

// ─── Sub-document interfaces ──────────────────────────────────────────────────

export interface IMicros {
  vitaminA_mcg?: number;
  vitaminC_mg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  sodium_mg?: number;
  fiber_g?: number;
  sugar_g?: number;
}

export interface IMacros {
  proteinG: number;
  carbG: number;
  fatG: number;
}

export interface IFoodItem {
  name: string;
  quantity: {
    amount: number;
    unit: string;
  };
  calories: number;
  macros: IMacros;
  micros?: IMicros;
}

export interface ITotals {
  calories: number;
  proteinG: number;
  carbG: number;
  fatG: number;
}

export interface IAiMeta {
  confidence: number;
  rawModelResponseId?: string;
}

// ─── Meal document interface ──────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealSource = 'manual' | 'ai_label' | 'ai_plate' | 'import';

export interface IMeal extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  mealType: MealType;
  date: Date;        // UTC midnight of the user's local calendar day at creation time
  loggedAt: Date;    // Actual timestamp — used by aggregation pipelines with $dateTrunc
  items: IFoodItem[];
  totals: ITotals;   // Denormalized; computed server-side on every write
  source: MealSource;
  aiMeta?: IAiMeta;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-document schemas ─────────────────────────────────────────────────────

const MicrosSchema = new Schema<IMicros>(
  {
    vitaminA_mcg: Number,
    vitaminC_mg: Number,
    calcium_mg: Number,
    iron_mg: Number,
    sodium_mg: Number,
    fiber_g: Number,
    sugar_g: Number,
  },
  { _id: false }
);

const MacrosSchema = new Schema<IMacros>(
  {
    proteinG: { type: Number, required: true, min: 0 },
    carbG: { type: Number, required: true, min: 0 },
    fatG: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const FoodItemSchema = new Schema<IFoodItem>(
  {
    name: { type: String, required: true, trim: true },
    quantity: {
      amount: { type: Number, required: true, min: 0 },
      unit: { type: String, required: true, trim: true },
    },
    calories: { type: Number, required: true, min: 0 },
    macros: { type: MacrosSchema, required: true },
    micros: { type: MicrosSchema },
  },
  { _id: false }
);

const TotalsSchema = new Schema<ITotals>(
  {
    calories: { type: Number, required: true },
    proteinG: { type: Number, required: true },
    carbG: { type: Number, required: true },
    fatG: { type: Number, required: true },
  },
  { _id: false }
);

// ─── Meal schema ─────────────────────────────────────────────────────────────

const MealSchema = new Schema<IMeal>(
  {
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
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
// Primary query: user's meals in a date range, newest first
MealSchema.index({ userId: 1, date: -1 });
// Filtered listing (by meal type)
MealSchema.index({ userId: 1, date: -1, mealType: 1 });

export const MealModel = mongoose.model<IMeal>('Meal', MealSchema);
