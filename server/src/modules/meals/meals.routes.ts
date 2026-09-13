import { Router } from 'express';
import { mealsController } from './meals.controller';
import { validate } from '../../common/middleware/validate.middleware';
import { CreateMealSchema, ListMealsSchema, UpdateMealSchema } from '../../common/schemas/request.schemas';

const router = Router();

router.post('/', validate(CreateMealSchema), mealsController.create);
router.get('/', validate(ListMealsSchema), mealsController.list);
router.get('/:id', mealsController.getOne);
router.patch('/:id', validate(UpdateMealSchema), mealsController.update);
router.delete('/:id', mealsController.remove);

export { router as mealsRouter };
