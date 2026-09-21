import { Router } from 'express';
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/register', registerController);
authRouter.post('/login', loginController);
authRouter.post('/refresh', refreshController);
authRouter.post('/logout', logoutController);
authRouter.get('/me', authenticate, meController);
