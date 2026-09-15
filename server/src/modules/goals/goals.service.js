import { goalsRepository } from './goals.repository.js';
export const goalsService = {
    async createGoal(userId, data) {
        return goalsRepository.create({
            userId,
            dailyCalorieTarget: data.dailyCalorieTarget,
            proteinTargetG: data.proteinTargetG,
            carbTargetG: data.carbTargetG,
            ...(data.fatTargetG === undefined ? {} : { fatTargetG: data.fatTargetG }),
            weightGoalKg: data.weightGoalKg,
            // Default effectiveFrom to now if not specified
            effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        });
    },
    async getCurrentGoal(userId) {
        return goalsRepository.findCurrent(userId);
    },
    async getGoalAsOf(userId, dateStr) {
        return goalsRepository.findAsOf(userId, new Date(dateStr));
    },
    async getHistory(userId, cursor, limit) {
        return goalsRepository.findHistory(userId, cursor, limit);
    },
};