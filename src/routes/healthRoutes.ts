import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

router.get('/', asyncHandler(healthCheck));

export default router;
