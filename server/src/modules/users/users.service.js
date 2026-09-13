import { usersRepository } from './users.repository.js';
import { Errors } from '../../common/middleware/errorHandler.middleware.js';
export const usersService = {
    async getProfile(userId) {
        const user = await usersRepository.findById(userId);
        if (!user)
            throw Errors.notFound('User');
        return user;
    },
    async updateTimezone(userId, timezone) {
        const user = await usersRepository.updateTimezone(userId, timezone);
        if (!user)
            throw Errors.notFound('User');
        return user;
    },
};