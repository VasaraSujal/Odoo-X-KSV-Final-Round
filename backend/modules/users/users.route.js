import express from 'express';
import userController from './users.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/role.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateProfileSchema } from './users.validation.js';

const router = express.Router();

router.use(verifyToken);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

// Admin routes
router.use(authorize('ADMIN'));
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', validate(updateProfileSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
