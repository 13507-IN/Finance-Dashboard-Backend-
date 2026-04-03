import { Request, Response } from 'express';
import { financialRecordService } from '../services/financialRecordService';
import { AuthenticatedRequest } from '../types/auth';
import { RequestWithValidatedQuery } from '../types/request';
import { sendSuccess } from '../utils/response';
import { FinancialRecordFilterInput } from '../validators/financialRecordValidator';

export async function createFinancialRecord(req: Request, res: Response): Promise<void> {
  const record = await financialRecordService.createRecord(req.body, (req as AuthenticatedRequest).user.id);
  sendSuccess(res, 201, 'Financial record created successfully', record);
}

export async function getFinancialRecords(req: Request, res: Response): Promise<void> {
  const request = req as RequestWithValidatedQuery<FinancialRecordFilterInput>;
  const records = await financialRecordService.listRecords(
    request.validatedQuery ?? (req.query as unknown as FinancialRecordFilterInput),
  );
  sendSuccess(res, 200, 'Financial records fetched successfully', records);
}

export async function updateFinancialRecord(req: Request, res: Response): Promise<void> {
  const record = await financialRecordService.updateRecord(Number(req.params.id), req.body);
  sendSuccess(res, 200, 'Financial record updated successfully', record);
}

export async function deleteFinancialRecord(req: Request, res: Response): Promise<void> {
  await financialRecordService.deleteRecord(Number(req.params.id));
  sendSuccess(res, 200, 'Financial record deleted successfully');
}
