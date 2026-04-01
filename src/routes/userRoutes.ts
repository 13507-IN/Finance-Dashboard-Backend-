import { Router } from 'express';
import { getUserById, listUsers, updateUser } from '../controllers/userController';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/errorHandler';
import { authorize } from '../middlewares/rbacMiddleware';
import { validateBody, validateParams } from '../middlewares/validateMiddleware';
import { updateUserSchema, userIdParamSchema } from '../validators/userValidator';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', asyncHandler(listUsers));
router.get('/:id', validateParams(userIdParamSchema), asyncHandler(getUserById));
router.patch('/:id', validateParams(userIdParamSchema), validateBody(updateUserSchema), asyncHandler(updateUser));

export default router;
