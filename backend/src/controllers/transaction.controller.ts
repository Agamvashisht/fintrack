import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

const txService = new TransactionService();

export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tx = await txService.createTransaction({
      ...req.body,
      userId: req.user!.userId,
    });
    sendCreated(res, tx, 'Transaction created');
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await txService.getTransactions(req.user!.userId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      type: req.query.type as 'INCOME' | 'EXPENSE' | undefined,
      categoryId: req.query.categoryId as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      sortBy: (req.query.sortBy as string) || 'date',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    });
    sendSuccess(res, result.transactions, 'Transactions retrieved', 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tx = await txService.getTransactionById(req.params.id, req.user!.userId);
    sendSuccess(res, tx);
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tx = await txService.updateTransaction(req.params.id, req.user!.userId, req.body);
    sendSuccess(res, tx, 'Transaction updated');
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await txService.deleteTransaction(req.params.id, req.user!.userId);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
};

export const getMonthlySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { month, year } = req.query;
    const summary = await txService.getMonthlySummary(
      req.user!.userId,
      Number(month),
      Number(year),
    );
    sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

export const getCategoryBreakdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, type } = req.query;
    const breakdown = await txService.getCategoryBreakdown(
      req.user!.userId,
      startDate as string,
      endDate as string,
      type as 'INCOME' | 'EXPENSE' | undefined,
    );
    sendSuccess(res, breakdown);
  } catch (error) {
    next(error);
  }
};

export const getWeeklySummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await txService.getWeeklySummary(
      req.user!.userId,
      startDate as string,
      endDate as string,
    );
    sendSuccess(res, summary);
  } catch (error) {
    next(error);
  }
};

export const getRolling3MonthAverage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await txService.getRolling3MonthAverage(req.user!.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
