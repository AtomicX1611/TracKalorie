import { Schema, model } from 'mongoose';
const GoalSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    dailyCalorieTarget: { type: Number, required: true, min: 1 },
    proteinTargetG: { type: Number, required: true, min: 1 },
    carbTargetG: { type: Number, required: true, min: 1 },
    fatTargetG: { type: Number, min: 1 },
    weightGoalKg: { type: Number, min: 0 },
    effectiveFrom: { type: Date, required: true, default: () => new Date() },
}, {
    timestamps: { createdAt: true, updatedAt: false }, // goals are immutable after creation
});
// Compound index: covers "current goal" (sort effectiveFrom desc) and
// "goal as of date D" (find effectiveFrom <= D) queries
GoalSchema.index({ userId: 1, effectiveFrom: -1 });
export const GoalModel = model('Goal', GoalSchema);