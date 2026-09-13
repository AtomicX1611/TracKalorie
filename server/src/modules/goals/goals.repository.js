import { GoalModel } from './goals.schema.js';
import { Types } from 'mongoose';
export const goalsRepository = {
    async create(data) {
        return GoalModel.create({
            ...data,
            userId: new Types.ObjectId(data.userId),
        });
    },
    async findCurrent(userId) {
        return GoalModel.findOne({ userId: new Types.ObjectId(userId) })
            .sort({ effectiveFrom: -1 })
            .limit(1);
    },
    async findAsOf(userId, date) {
        return GoalModel.findOne({
            userId: new Types.ObjectId(userId),
            effectiveFrom: { $lte: date },
        })
            .sort({ effectiveFrom: -1 })
            .limit(1);
    },
    async findHistory(userId, cursor, limit = 20) {
        const query = { userId: new Types.ObjectId(userId) };
        if (cursor) {
            try {
                const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString());
                query['effectiveFrom'] = { $lt: new Date(decoded.effectiveFrom) };
            }
            catch {
                // Invalid cursor — ignore and start from beginning
            }
        }
        const goals = await GoalModel.find(query)
            .sort({ effectiveFrom: -1 })
            .limit(limit + 1); // fetch one extra to determine hasMore
        const hasMore = goals.length > limit;
        const results = hasMore ? goals.slice(0, limit) : goals;
        let nextCursor = null;
        if (hasMore && results.length > 0) {
            const last = results[results.length - 1];
            nextCursor = Buffer.from(JSON.stringify({ effectiveFrom: last.effectiveFrom.toISOString() })).toString('base64url');
        }
        return { goals: results, nextCursor };
    },
};