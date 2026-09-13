import { nutritionRepository } from './nutrition.repository';

function parseDateRange(from: string, to: string): { fromDate: Date; toDate: Date } {
  const fromDate = new Date(from + 'T00:00:00.000Z');
  const toDate = new Date(to + 'T23:59:59.999Z');
  return { fromDate, toDate };
}

export const nutritionService = {
  async getWeeklyTrend(userId: string, from: string, to: string, timezone: string) {
    const { fromDate, toDate } = parseDateRange(from, to);
    return nutritionRepository.getWeeklyTrend(userId, fromDate, toDate, timezone);
  },

  async getMacroBreakdown(
    userId: string,
    from: string,
    to: string,
    timezone: string,
    granularity: 'day' | 'week'
  ) {
    const { fromDate, toDate } = parseDateRange(from, to);
    return nutritionRepository.getMacroBreakdown(userId, fromDate, toDate, timezone, granularity);
  },

  async getMicroSummary(userId: string, from: string, to: string) {
    const { fromDate, toDate } = parseDateRange(from, to);
    return nutritionRepository.getMicroSummary(userId, fromDate, toDate);
  },

  async getGoalVsActual(userId: string, from: string, to: string, timezone: string) {
    const { fromDate, toDate } = parseDateRange(from, to);
    return nutritionRepository.getGoalVsActual(userId, fromDate, toDate, timezone);
  },
};
