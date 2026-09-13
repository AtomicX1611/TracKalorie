import { UserModel } from './users.schema.js';
import { Types } from 'mongoose';
/**
 * User repository — Mongoose queries ONLY.
 * No business logic lives here. All business logic lives in users.service.
 */
export const usersRepository = {
    async findById(id) {
        return UserModel.findById(new Types.ObjectId(id));
    },
    async findByEmail(email) {
        return UserModel.findOne({ email: email.toLowerCase() });
    },
    async create(data) {
        return UserModel.create(data);
    },
    async updateTimezone(userId, timezone) {
        return UserModel.findByIdAndUpdate(new Types.ObjectId(userId), { timezone }, { new: true });
    },
};