import { authService } from './auth.service.js';
export const authController = {
    async register(req, res, next) {
        try {
            const { email, password } = req.body;
            const tokens = await authService.register(email, password);
            res.status(201).json({ data: tokens });
        }
        catch (err) {
            next(err);
        }
    },
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const tokens = await authService.login(email, password);
            res.status(200).json({ data: tokens });
        }
        catch (err) {
            next(err);
        }
    },
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const tokens = await authService.refresh(refreshToken);
            res.status(200).json({ data: tokens });
        }
        catch (err) {
            next(err);
        }
    },
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    },
    async me(req, res, next) {
        try {
            // req.user is populated by verifyJwt middleware
            res.status(200).json({ data: { userId: req.user.id, email: req.user.email } });
        }
        catch (err) {
            next(err);
        }
    },
};