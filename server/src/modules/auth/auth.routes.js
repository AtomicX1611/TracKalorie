import { Router } from 'express';
import { authController } from './auth.controller.js';
import { verifyJwt } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { RegisterSchema, LoginSchema, RefreshSchema } from '../../common/schemas/request.schemas.js';
const router = Router();
export { router as authRouter };
// Public routes — no JWT required
router.post('/register', validate(RegisterSchema), authController.register);
router.post('/login', validate(LoginSchema), authController.login);
router.post('/refresh', validate(RefreshSchema), authController.refresh);
router.post('/logout', authController.logout);
// Protected: GET /me — requires JWT
router.get('/me', verifyJwt, authController.me);