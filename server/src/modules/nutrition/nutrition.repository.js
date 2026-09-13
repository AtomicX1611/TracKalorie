import { MealModel } from '../meals/meals.schema.js';
import { GoalModel } from '../goals/goals.schema.js';
import { Types } from 'mongoose';
/**
 * Nutrition repository — MongoDB aggregation pipelines.
 *
 * KEY DESIGN DECISION: All $dateTrunc calls use the `timezone` parameter
 * passed from req.timezone (set by timezone.middleware.ts from the X-Timezone header).
 *
 * Why loggedAt, not date?
 * - meals.date is pre-computed UTC-midnight at write time using the timezone active then
 * - meals.loggedAt is the raw timestamp of the actual log event
 * - Report aggregations bucket off loggedAt + current request timezone via $dateTrunc
 *   so a user who changed their timezone still sees historically consistent day buckets
 * - The bucketing logic lives here (aggregation layer), not duplicated between write and read
 *
 * This is Section 5.10 of the architecture spec — a common interview gotcha.
 */
export const nutritionRepository = {
    async getWeeklyTrend(userId, from, to, timezone) {
        const results = await MealModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    loggedAt: { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: {
                        $dateTrunc: {
                            date: '$loggedAt',
                            unit: 'day',
                            timezone, // THE KEY LINE — dynamic timezone from frontend header
                        },
                    },
                    calories: { $sum: '$totals.calories' },
                    proteinG: { $sum: '$totals.proteinG' },
                    carbG: { $sum: '$totals.carbG' },
                    fatG: { $sum: '$totals.fatG' },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    day: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$_id',
                            timezone,
                        },
                    },
                    calories: 1,
                    proteinG: 1,
                    carbG: 1,
                    fatG: 1,
                },
            },
        ]);
        return results;
    },
    async getMacroBreakdown(userId, from, to, timezone, granularity) {
        const unit = granularity === 'week' ? 'week' : 'day';
        const results = await MealModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    loggedAt: { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: {
                        $dateTrunc: {
                            date: '$loggedAt',
                            unit,
                            timezone,
                        },
                    },
                    calories: { $sum: '$totals.calories' },
                    proteinG: { $sum: '$totals.proteinG' },
                    carbG: { $sum: '$totals.carbG' },
                    fatG: { $sum: '$totals.fatG' },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    period: {
                        $dateToString: {
                            format: granularity === 'week' ? '%Y-W%V' : '%Y-%m-%d',
                            date: '$_id',
                            timezone,
                        },
                    },
                    calories: 1,
                    proteinG: 1,
                    carbG: 1,
                    fatG: 1,
                },
            },
        ]);
        return results;
    },
    async getMicroSummary(userId, from, to) {
        const results = await MealModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    loggedAt: { $gte: from, $lte: to },
                },
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: null,
                    vitaminA_mcg: { $sum: { $ifNull: ['$items.micros.vitaminA_mcg', 0] } },
                    vitaminC_mg: { $sum: { $ifNull: ['$items.micros.vitaminC_mg', 0] } },
                    calcium_mg: { $sum: { $ifNull: ['$items.micros.calcium_mg', 0] } },
                    iron_mg: { $sum: { $ifNull: ['$items.micros.iron_mg', 0] } },
                    sodium_mg: { $sum: { $ifNull: ['$items.micros.sodium_mg', 0] } },
                    fiber_g: { $sum: { $ifNull: ['$items.micros.fiber_g', 0] } },
                    sugar_g: { $sum: { $ifNull: ['$items.micros.sugar_g', 0] } },
                },
            },
            { $project: { _id: 0 } },
        ]);
        return results[0] ?? {
            vitaminA_mcg: 0, vitaminC_mg: 0, calcium_mg: 0,
            iron_mg: 0, sodium_mg: 0, fiber_g: 0, sugar_g: 0,
        };
    },
    async getGoalVsActual(userId, from, to, timezone) {
        // Step 1: aggregate actuals per day (timezone-aware)
        const actuals = await MealModel.aggregate([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    loggedAt: { $gte: from, $lte: to },
                },
            },
            {
                $group: {
                    _id: {
                        $dateTrunc: { date: '$loggedAt', unit: 'day', timezone },
                    },
                    calories: { $sum: '$totals.calories' },
                    proteinG: { $sum: '$totals.proteinG' },
                    carbG: { $sum: '$totals.carbG' },
                    fatG: { $sum: '$totals.fatG' },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        // Step 2: fetch all goal records that could apply in this range
        // (goals with effectiveFrom <= to, sorted desc, in application code)
        const goals = await GoalModel.find({
            userId: new Types.ObjectId(userId),
            effectiveFrom: { $lte: to },
        }).sort({ effectiveFrom: -1 });
        // Step 3: for each day, find the goal active at that day (in app code, not $lookup)
        // This is cheap: goals per user are few (< 100 historically)
        function findGoalForDate(date) {
            return goals.find((g) => g.effectiveFrom <= date) ?? null;
        }
        return actuals.map((row) => {
            const day = row._id;
            const goal = findGoalForDate(day);
            return {
                day: day.toISOString().split('T')[0],
                actual: {
                    calories: row.calories,
                    proteinG: row.proteinG,
                    carbG: row.carbG,
                    fatG: row.fatG,
                },
                goal: goal
                    ? {
                        dailyCalorieTarget: goal.dailyCalorieTarget,
                        proteinTargetG: goal.proteinTargetG,
                        carbTargetG: goal.carbTargetG,
                        fatTargetG: goal.fatTargetG,
                    }
                    : null,
            };
        });
    },
};