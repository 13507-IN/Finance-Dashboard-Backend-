import { Router } from 'express';
import { createCategory, getCategories } from '../controllers/categoryController';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/errorHandler';
import { authorize } from '../middlewares/rbacMiddleware';
import { validateBody, validateQuery } from '../middlewares/validateMiddleware';
import { categoryQuerySchema, createCategorySchema } from '../validators/categoryValidator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('VIEWER', 'ANALYST', 'ADMIN'), validateQuery(categoryQuerySchema), asyncHandler(getCategories));
router.post(
  '/',
  authorize('VIEWER', 'ANALYST', 'ADMIN'),
  validateBody(createCategorySchema),
  asyncHandler(createCategory),
);

export default router;
