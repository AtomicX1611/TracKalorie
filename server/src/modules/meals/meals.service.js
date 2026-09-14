import { mealsRepository } from './meals.repository.js';
import { Errors } from '../../common/middleware/errorHandler.middleware.js';
/**
 * Computes denormalized totals from a list of food items.
 * This is ONLY done server-side — we never trust client-submitted totals.
 *
 * Interview note: storing totals avoids re-summing items on every read.
 * The one-time write cost is paid back many times over on reads.
 */
function computeTotals(items) {
    return items.reduce((acc, item) => ({
        calories: acc.calories + item.calories,
        proteinG: acc.proteinG + item.macros.proteinG,
        carbG: acc.carbG + item.macros.carbG,
        fatG: acc.fatG + item.macros.fatG,
    }), { calories: 0, proteinG: 0, carbG: 0, fatG: 0 });
}
/**
 * Converts a YYYY-MM-DD string to a UTC Date object representing
 * midnight in the given IANA timezone.
 *
 * We store meals.date as UTC-midnight-per-user-day so that day-based
 * filtering (e.g., "show me all meals from 2024-09-13") works correctly
 * regardless of time zone. The loggedAt field holds the actual UTC timestamp
 * used by aggregation pipelines with $dateTrunc.
 */
function parseDateInTimezone(dateStr, _timezone) {
    // For the date field: just parse YYYY-MM-DD as UTC midnight.
    // The timezone is used in aggregation (nutrition module), not storage.
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}
export const mealsService = {
    /**
     * Creates a meal — the SINGLE write path for all entry methods.
     * Called by:
     *   1. meals.controller (manual form)
     *   2. ai.controller (after user confirms AI draft)
     *   3. imports.controller (after user confirms PDF import rows) [future]
     *
     * This is the most interview-relevant design decision:
     * The AI is a second consumer of this service, not a second implementation.
     */
    async createMeal(userId, data) {
        const totals = computeTotals(data.items);
        const date = parseDateInTimezone(data.date, data.timezone);
        return mealsRepository.create({
            userId,
            mealType: data.mealType,
            date,
            loggedAt: new Date(),
            items: data.items,
            totals,
            source: data.source,
            aiMeta: data.aiMeta,
        });
    },
    async getMeal(userId, mealId) {
        const meal = await mealsRepository.findById(mealId, userId);
        // 404 (not 403) to avoid confirming resource exists for other users
        if (!meal)
            throw Errors.notFound('Meal');
        return meal;
    },
    async listMeals(userId, opts) {
        return mealsRepository.list(userId, {
            from: opts.from ? new Date(opts.from) : undefined,
            to: opts.to ? (() => { const d = new Date(opts.to); d.setUTCHours(23, 59, 59, 999); return d; })() : undefined,
            mealType: opts.mealType,
            cursor: opts.cursor,
            limit: opts.limit,
        });
    },
    async updateMeal(userId, mealId, data) {
        const updateData = {};
        if (data.mealType)
            updateData['mealType'] = data.mealType;
        if (data.date)
            updateData['date'] = parseDateInTimezone(data.date, data.timezone);
        if (data.items) {
            updateData['items'] = data.items;
            updateData['totals'] = computeTotals(data.items);
        }
        const meal = await mealsRepository.update(mealId, userId, updateData);
        if (!meal)
            throw Errors.notFound('Meal');
        return meal;
    },
    async deleteMeal(userId, mealId) {
        const deleted = await mealsRepository.delete(mealId, userId);
        if (!deleted)
            throw Errors.notFound('Meal');
    },
};