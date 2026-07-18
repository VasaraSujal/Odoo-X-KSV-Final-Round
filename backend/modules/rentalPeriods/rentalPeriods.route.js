import express from 'express';
import rpController from './rentalPeriods.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createRentalPeriodSchema, updateRentalPeriodSchema } from './rentalPeriods.validation.js';

const router = express.Router();

router.use(verifyToken, authorize('ADMIN'));

router.post('/', validate(createRentalPeriodSchema), rpController.create);
router.get('/', rpController.getAll);
router.get('/:id', rpController.getById);
router.put('/:id', validate(updateRentalPeriodSchema), rpController.update);
router.delete('/:id', rpController.delete);

export default router;
