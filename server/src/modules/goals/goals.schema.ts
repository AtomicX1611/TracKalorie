import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IGoal extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  dailyCalorieTarget: number;
  proteinTargetG: number;
  carbTargetG: number;
  fatTargetG: number;
  weightGoalKg?: number;
  effectiveFrom: Date;
  createdAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dailyCalorieTarget: { type: Number, required: true, min: 0 },
    proteinTargetG: { type: Number, required: true, min: 0 },
    carbTargetG: { type: Number, required: true, min: 0 },
    fatTargetG: { type: Number, required: true, min: 0 },
    weightGoalKg: { type: Number, min: 0 },
    effectiveFrom: { type: Date, required: true, default: () => new Date() },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // goals are immutable after creation
  }
);

// Compound index: covers "current goal" (sort effectiveFrom desc) and
// "goal as of date D" (find effectiveFrom <= D) queries
GoalSchema.index({ userId: 1, effectiveFrom: -1 });

export const GoalModel = mongoose.model<IGoal>('Goal', GoalSchema);
