import { Router } from 'express';
import {
  createFinancialRecord,
  deleteFinancialRecord,
  getFinancialRecords,
  updateFinancialRecord,
} from '../controllers/financialRecordController';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../middlewares/errorHandler';
import { authorize } from '../middlewares/rbacMiddleware';
import {
  financialRecordFilterSchema,
  financialRecordIdSchema,
  createFinancialRecordSchema,
  updateFinancialRecordSchema,
} from '../validators/financialRecordValidator';
import { validateBody, validateParams, validateQuery } from '../middlewares/validateMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ANALYST', 'ADMIN'), validateQuery(financialRecordFilterSchema), asyncHandler(getFinancialRecords));
router.post('/', authorize('ADMIN'), validateBody(createFinancialRecordSchema), asyncHandler(createFinancialRecord));
router.patch(
  '/:id',
  authorize('ADMIN'),
  validateParams(financialRecordIdSchema),
  validateBody(updateFinancialRecordSchema),
  asyncHandler(updateFinancialRecord),
);
router.delete('/:id', authorize('ADMIN'), validateParams(financialRecordIdSchema), asyncHandler(deleteFinancialRecord));

export default router;
