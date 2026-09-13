import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../common/middleware/validate.middleware';
import { UpdateUserSchema } from '../../common/schemas/request.schemas';

const router = Router();

// All /users routes require JWT (applied in app.ts globally after /auth)
router.get('/me', usersController.getMe);
router.patch('/me', validate(UpdateUserSchema), usersController.updateMe);

export { router as usersRouter };
