import { Router } from 'express';
import { usersController } from './users.controller.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { UpdateUserSchema } from '../../common/schemas/request.schemas.js';
const router = Router();
export { router as usersRouter };
// All /users routes require JWT (applied in app.ts globally after /auth)
router.get('/me', usersController.getMe);
router.patch('/me', validate(UpdateUserSchema), usersController.updateMe);