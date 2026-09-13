import { usersRepository } from './users.repository';
import { IUser } from './users.schema';
import { Errors } from '../../common/middleware/errorHandler.middleware';

export const usersService = {
  async getProfile(userId: string): Promise<IUser> {
    const user = await usersRepository.findById(userId);
    if (!user) throw Errors.notFound('User');
    return user;
  },

  async updateTimezone(userId: string, timezone: string): Promise<IUser> {
    const user = await usersRepository.updateTimezone(userId, timezone);
    if (!user) throw Errors.notFound('User');
    return user;
  },
};
