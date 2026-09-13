import { MealModel, IMeal, IFoodItem, ITotals, MealType, MealSource } from './meals.schema';
import { Types } from 'mongoose';

interface ListMealsOptions {
  from?: Date;
  to?: Date;
  mealType?: MealType;
  cursor?: string; // base64url-encoded { date: ISO, _id: string }
  limit?: number;
}

export const mealsRepository = {
  async create(data: {
    userId: string;
    mealType: MealType;
    date: Date;
    loggedAt: Date;
    items: IFoodItem[];
    totals: ITotals;
    source: MealSource;
    aiMeta?: { confidence: number; rawModelResponseId?: string };
  }): Promise<IMeal> {
    return MealModel.create({
      ...data,
      userId: new Types.ObjectId(data.userId),
    });
  },

  async findById(mealId: string, userId: string): Promise<IMeal | null> {
    return MealModel.findOne({
      _id: new Types.ObjectId(mealId),
      userId: new Types.ObjectId(userId),
    });
  },

  async list(
    userId: string,
    opts: ListMealsOptions
  ): Promise<{ meals: IMeal[]; nextCursor: string | null }> {
    const limit = opts.limit ?? 20;
    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    // Date range filter
    if (opts.from || opts.to) {
      const dateFilter: Record<string, Date> = {};
      if (opts.from) dateFilter.$gte = opts.from;
      if (opts.to) dateFilter.$lte = opts.to;
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
      } catch {
        // Invalid cursor — ignore, start from beginning
      }
    }

    const meals = await MealModel.find(query)
      .sort({ date: -1, _id: -1 })
      .limit(limit + 1);

    const hasMore = meals.length > limit;
    const results = hasMore ? meals.slice(0, limit) : meals;

    let nextCursor: string | null = null;
    if (hasMore && results.length > 0) {
      const last = results[results.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ date: last.date.toISOString(), _id: last._id.toString() })
      ).toString('base64url');
    }

    return { meals: results, nextCursor };
  },

  async update(
    mealId: string,
    userId: string,
    data: {
      mealType?: MealType;
      items?: IFoodItem[];
      totals?: ITotals;
    }
  ): Promise<IMeal | null> {
    return MealModel.findOneAndUpdate(
      { _id: new Types.ObjectId(mealId), userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true }
    );
  },

  async delete(mealId: string, userId: string): Promise<boolean> {
    const result = await MealModel.deleteOne({
      _id: new Types.ObjectId(mealId),
      userId: new Types.ObjectId(userId),
    });
    return result.deletedCount === 1;
  },
};
