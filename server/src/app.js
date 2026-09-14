import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './common/config/config.js';
import { verifyJwt } from './common/middleware/auth.middleware.js';
import { timezoneMiddleware } from './common/middleware/timezone.middleware.js';
import { errorHandler } from './common/middleware/errorHandler.middleware.js';
// Domain routers
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { goalsRouter } from './modules/goals/goals.routes.js';
import { mealsRouter } from './modules/meals/meals.routes.js';
import { nutritionRouter } from './modules/nutrition/nutrition.routes.js';
import { aiRouter } from './modules/ai/ai.routes.js';
import { chatRouter } from './modules/chat/index.js';
export function createApp() {
    const app = express();
    app.use(helmet());
    app.use(cors({
        origin: (requestOrigin, callback) => {
            if (!requestOrigin || config.cors.clientOrigins.includes(requestOrigin)) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Timezone',
            'Idempotency-Key',
        ],
    }));
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
    if (config.node.env !== 'test') {
        app.use(morgan(config.node.env === 'production' ? 'combined' : 'dev'));
    }
    // Timezone middleware — runs on every request (before and after auth)
    app.use(timezoneMiddleware);
    // ─── Health check (public) ────────────────────────────────────────────────
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.node.env });
    });
    // ─── Rate limiter for auth routes (brute-force protection) ───────────────
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // 20 attempts per window per IP
        message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth attempts, try again later' } },
        standardHeaders: true,
        legacyHeaders: false,
    });
    // ─── Public routes (no JWT) ───────────────────────────────────────────────
    app.use('/api/v1/auth', authLimiter, authRouter);
    // ─── JWT guard — all routes below require a valid access token ────────────
    app.use(verifyJwt);
    // ─── Protected routes ─────────────────────────────────────────────────────
    app.use('/api/v1/users', usersRouter);
    app.use('/api/v1/goals', goalsRouter);
    app.use('/api/v1/meals', mealsRouter);
    app.use('/api/v1/nutrition', nutritionRouter);
    app.use('/api/v1/ai', aiRouter);
    app.use('/api/v1/chat', chatRouter);
    // ─── 404 handler ──────────────────────────────────────────────────────────
    app.use((_req, res) => {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
    });
    // ─── Global error handler (must be last) ──────────────────────────────────
    app.use(errorHandler);
    return app;
}