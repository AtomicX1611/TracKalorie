import { nutritionRepository } from './nutrition.repository.js';
function parseDateRange(from, to) {
    const fromDate = new Date(from + 'T00:00:00.000Z');
    const toDate = new Date(to + 'T23:59:59.999Z');
    return { fromDate, toDate };
}
export const nutritionService = {
    async getWeeklyTrend(userId, from, to, timezone) {
        const { fromDate, toDate } = parseDateRange(from, to);
        return nutritionRepository.getWeeklyTrend(userId, fromDate, toDate, timezone);
    },
    async getMacroBreakdown(userId, from, to, timezone, granularity) {
        const { fromDate, toDate } = parseDateRange(from, to);
        return nutritionRepository.getMacroBreakdown(userId, fromDate, toDate, timezone, granularity);
    },
    async getMicroSummary(userId, from, to, timezone) {
        const { fromDate, toDate } = parseDateRange(from, to);
        return nutritionRepository.getMicroSummary(userId, fromDate, toDate, timezone);
    },
    async getGoalVsActual(userId, from, to, timezone) {
        const { fromDate, toDate } = parseDateRange(from, to);
        return nutritionRepository.getGoalVsActual(userId, fromDate, toDate, timezone);
    },
};