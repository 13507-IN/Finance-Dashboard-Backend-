import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { RequestWithValidatedQuery } from '../types/request';
import { categoryService } from '../services/categoryService';
import { sendSuccess } from '../utils/response';
import { CategoryQueryInput } from '../validators/categoryValidator';

export async function getCategories(req: Request, res: Response): Promise<void> {
  const request = req as RequestWithValidatedQuery<CategoryQueryInput>;
  const categories = await categoryService.listCategories(
    request.validatedQuery ?? (req.query as unknown as CategoryQueryInput),
  );
  sendSuccess(res, 200, 'Categories fetched successfully', categories);
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const category = await categoryService.createCategory(req.body, (req as AuthenticatedRequest).user);
  sendSuccess(res, 201, 'Category created successfully', category);
}
