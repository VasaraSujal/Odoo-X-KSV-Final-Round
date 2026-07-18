import express from 'express';
import plController from './priceLists.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createPriceListSchema, updatePriceListSchema } from './priceLists.validation.js';

const router = express.Router();

router.use(verifyToken, authorize('ADMIN'));

router.post('/', validate(createPriceListSchema), plController.create);
router.get('/', plController.getAll);
router.get('/:id', plController.getById);
router.put('/:id', validate(updatePriceListSchema), plController.update);
router.delete('/:id', plController.delete);

export default router;
