import { UserModel, IUser } from './users.schema';
import { Types } from 'mongoose';

/**
 * User repository — Mongoose queries ONLY.
 * No business logic lives here. All business logic lives in users.service.
 */
export const usersRepository = {
  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(new Types.ObjectId(id));
  },

  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase() });
  },

  async create(data: { email: string; passwordHash: string; timezone?: string }): Promise<IUser> {
    return UserModel.create(data);
  },

  async updateTimezone(userId: string, timezone: string): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      new Types.ObjectId(userId),
      { timezone },
      { new: true }
    );
  },
};
