import express from 'express';
import authController from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from './auth.validation.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', verifyToken, authController.me);
router.post('/logout', authController.logout);
router.post(
  '/change-password',
  verifyToken,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
