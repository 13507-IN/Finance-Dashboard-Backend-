import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/dashboardController';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/errorHandler';
import { authorize } from '../middlewares/rbacMiddleware';
import { validateQuery } from '../middlewares/validateMiddleware';
import { dashboardQuerySchema } from '../validators/dashboardValidator';

const router = Router();

router.use(authenticate);

// VIEWER can access only dashboard GET endpoints.
router.get('/', authorize('VIEWER', 'ANALYST', 'ADMIN'), validateQuery(dashboardQuerySchema), asyncHandler(getDashboardAnalytics));

export default router;
