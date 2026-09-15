import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dailyCalorieTarget: { type: Number, required: true, min: 0 },
    proteinTargetG:     { type: Number, required: true, min: 0 },
    carbTargetG:        { type: Number, required: true, min: 0 },
    fatTargetG:         { type: Number, min: 1 },
    weightGoalKg:       { type: Number, min: 0 },
    // Effective-dated: goals are immutable after creation.
    // Always append a new row; never update an existing one.
    effectiveFrom: { type: Date, required: true, default: () => new Date() },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { transform: (_d, ret) => { delete ret.__v; return ret; } },
  }
);

// Compound index: covers "current goal" and "goal as of date D"
GoalSchema.index({ userId: 1, effectiveFrom: -1 });

export const GoalModel = mongoose.model('Goal', GoalSchema);
