import { Router } from 'express';
import { authController } from './auth.controller';
import { verifyJwt } from '../../common/middleware/auth.middleware';
import { validate } from '../../common/middleware/validate.middleware';
import { RegisterSchema, LoginSchema, RefreshSchema } from '../../common/schemas/request.schemas';

const router = Router();

// Public routes — no JWT required
router.post('/register', validate(RegisterSchema), authController.register);
router.post('/login', validate(LoginSchema), authController.login);
router.post('/refresh', validate(RefreshSchema), authController.refresh);
router.post('/logout', authController.logout);

// Protected: GET /me — requires JWT
router.get('/me', verifyJwt, authController.me);

export { router as authRouter };
