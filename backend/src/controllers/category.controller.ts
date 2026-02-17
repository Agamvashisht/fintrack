import { Request, Response, NextFunction } from 'express';
import { CategoryRepository } from '../repositories/category.repository';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { NotFoundError } from '../utils/errors';

const categoryRepo = new CategoryRepository();

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await categoryRepo.create({
      ...req.body,
      userId: req.user!.userId,
    });
    sendCreated(res, category, 'Category created');
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await categoryRepo.findAll(req.user!.userId);
    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await categoryRepo.findById(req.params.id, req.user!.userId);
    if (!category) throw new NotFoundError('Category not found');
    sendSuccess(res, category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await categoryRepo.update(req.params.id, req.user!.userId, req.body);
    if (!category) throw new NotFoundError('Category not found');
    sendSuccess(res, category, 'Category updated');
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deleted = await categoryRepo.delete(req.params.id, req.user!.userId);
    if (!deleted) throw new NotFoundError('Category not found');
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
};
