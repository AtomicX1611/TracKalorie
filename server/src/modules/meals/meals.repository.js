import { MealModel } from './meals.schema.js';
import { Types } from 'mongoose';
export const mealsRepository = {
    async create(data) {
        return MealModel.create({
            ...data,
            userId: new Types.ObjectId(data.userId),
        });
    },
    async findById(mealId, userId) {
        return MealModel.findOne({
            _id: new Types.ObjectId(mealId),
            userId: new Types.ObjectId(userId),
        });
    },
    async list(userId, opts) {
        const limit = opts.limit ?? 20;
        const query = {
            userId: new Types.ObjectId(userId),
        };
        // Date range filter
        if (opts.from || opts.to) {
            const dateFilter = {};
            if (opts.from)
                dateFilter.$gte = opts.from;
            if (opts.to)
                dateFilter.$lte = opts.to;
            query['date'] = dateFilter;
        }
        if (opts.mealType) {
            query['mealType'] = opts.mealType;
        }
        // Cursor-based pagination: decode (date, _id) cursor
        if (opts.cursor) {
            try {
                const decoded = JSON.parse(Buffer.from(opts.cursor, 'base64url').toString());
                // Items before this cursor: date < cursorDate OR (date == cursorDate AND _id < cursorId)
                const cursorDate = new Date(decoded.date);
                const cursorId = new Types.ObjectId(decoded._id);
                query['$or'] = [
                    { date: { $lt: cursorDate } },
                    { date: cursorDate, _id: { $lt: cursorId } },
                ];
            }
            catch {
                // Invalid cursor — ignore, start from beginning
            }
        }
        const meals = await MealModel.find(query)
            .sort({ date: -1, _id: -1 })
            .limit(limit + 1);
        const hasMore = meals.length > limit;
        const results = hasMore ? meals.slice(0, limit) : meals;
        let nextCursor = null;
        if (hasMore && results.length > 0) {
            const last = results[results.length - 1];
            nextCursor = Buffer.from(JSON.stringify({ date: last.date.toISOString(), _id: last._id.toString() })).toString('base64url');
        }
        return { meals: results, nextCursor };
    },
    async update(mealId, userId, data) {
        return MealModel.findOneAndUpdate({ _id: new Types.ObjectId(mealId), userId: new Types.ObjectId(userId) }, { $set: data }, { new: true });
    },
    async delete(mealId, userId) {
        const result = await MealModel.deleteOne({
            _id: new Types.ObjectId(mealId),
            userId: new Types.ObjectId(userId),
        });
        return result.deletedCount === 1;
    },
};