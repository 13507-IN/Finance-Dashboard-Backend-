import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/errorHandler';
import { authLimiter } from '../middlewares/rateLimitMiddleware';
import { validateBody } from '../middlewares/validateMiddleware';
import { loginSchema, registerSchema } from '../validators/authValidator';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(register));
router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(login));
router.get('/me', authenticate, asyncHandler(getMe));

export default router;
