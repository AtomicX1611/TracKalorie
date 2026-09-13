import { goalsRepository } from './goals.repository';
import { IGoal } from './goals.schema';

export const goalsService = {
  async createGoal(
    userId: string,
    data: {
      dailyCalorieTarget: number;
      proteinTargetG: number;
      carbTargetG: number;
      fatTargetG: number;
      weightGoalKg?: number;
      effectiveFrom?: string; // ISO string from client
    }
  ): Promise<IGoal> {
    return goalsRepository.create({
      userId,
      dailyCalorieTarget: data.dailyCalorieTarget,
      proteinTargetG: data.proteinTargetG,
      carbTargetG: data.carbTargetG,
      fatTargetG: data.fatTargetG,
      weightGoalKg: data.weightGoalKg,
      // Default effectiveFrom to now if not specified
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
    });
  },

  async getCurrentGoal(userId: string): Promise<IGoal | null> {
    return goalsRepository.findCurrent(userId);
  },

  async getGoalAsOf(userId: string, dateStr: string): Promise<IGoal | null> {
    return goalsRepository.findAsOf(userId, new Date(dateStr));
  },

  async getHistory(userId: string, cursor?: string, limit?: number) {
    return goalsRepository.findHistory(userId, cursor, limit);
  },
};
