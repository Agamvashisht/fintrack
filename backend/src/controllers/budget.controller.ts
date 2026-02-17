import { Request, Response, NextFunction } from 'express';
import { BudgetService } from '../services/budget.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

const budgetService = new BudgetService();

export const createBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const budget = await budgetService.createBudget({
      ...req.body,
      userId: req.user!.userId,
    });
    sendCreated(res, budget, 'Budget created');
  } catch (error) {
    next(error);
  }
};

export const getBudgets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const budgets = await budgetService.getBudgets(req.user!.userId, month, year);
    sendSuccess(res, budgets);
  } catch (error) {
    next(error);
  }
};

export const getBudgetById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const budget = await budgetService.getBudgetById(req.params.id, req.user!.userId);
    sendSuccess(res, budget);
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const budget = await budgetService.updateBudget(
      req.params.id,
      req.user!.userId,
      req.body.amount,
    );
    sendSuccess(res, budget, 'Budget updated');
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await budgetService.deleteBudget(req.params.id, req.user!.userId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
};
