import { usersService } from './users.service.js';
export const usersController = {
    async getMe(req, res, next) {
        try {
            const user = await usersService.getProfile(req.user.id);
            res.status(200).json({ data: user });
        }
        catch (err) {
            next(err);
        }
    },
    async updateMe(req, res, next) {
        try {
            const { timezone } = req.body;
            if (!timezone) {
                res.status(200).json({ data: await usersService.getProfile(req.user.id) });
                return;
            }
            const user = await usersService.updateTimezone(req.user.id, timezone);
            res.status(200).json({ data: user });
        }
        catch (err) {
            next(err);
        }
    },
};