import { TransactionType } from '@prisma/client';
import { TransactionRepository, TransactionFilter } from '../repositories/transaction.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { buildPaginationMeta } from '../utils/response';

interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  categoryId: string;
  userId: string;
}

interface UpdateTransactionInput {
  amount?: number;
  type?: TransactionType;
  description?: string;
  date?: string;
  categoryId?: string;
}

interface TransactionQueryInput {
  page: number;
  limit: number;
  type?: TransactionType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TransactionService {
  private txRepo: TransactionRepository;
  private categoryRepo: CategoryRepository;

  constructor() {
    this.txRepo = new TransactionRepository();
    this.categoryRepo = new CategoryRepository();
  }

  async createTransaction(input: CreateTransactionInput) {
    const category = await this.categoryRepo.findById(input.categoryId, input.userId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return this.txRepo.create({
      ...input,
      date: new Date(input.date),
    });
  }

  async getTransactions(userId: string, query: TransactionQueryInput) {
    const filter: TransactionFilter = {
      userId,
      ...(query.type && { type: query.type }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.startDate && { startDate: new Date(query.startDate) }),
      ...(query.endDate && { endDate: new Date(query.endDate) }),
    };

    const { transactions, total } = await this.txRepo.findMany(filter, {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const serialized = transactions.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
    }));

    return {
      transactions: serialized,
      meta: buildPaginationMeta(total, query.page, query.limit),
    };
  }

  async getTransactionById(id: string, userId: string) {
    const tx = await this.txRepo.findById(id, userId);
    if (!tx) {
      throw new NotFoundError('Transaction not found');
    }
    return { ...tx, amount: Number(tx.amount) };
  }

  async updateTransaction(id: string, userId: string, input: UpdateTransactionInput) {
    const existing = await this.txRepo.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('Transaction not found');
    }

    if (input.categoryId) {
      const category = await this.categoryRepo.findById(input.categoryId, userId);
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    const updated = await this.txRepo.update(id, userId, {
      ...input,
      ...(input.date && { date: new Date(input.date) }),
    });

    return updated ? { ...updated, amount: Number(updated.amount) } : null;
  }

  async deleteTransaction(id: string, userId: string): Promise<void> {
    const deleted = await this.txRepo.delete(id, userId);
    if (!deleted) {
      throw new NotFoundError('Transaction not found');
    }
  }

  async getMonthlySummary(userId: string, month: number, year: number) {
    const summary = await this.txRepo.getMonthlySummary(userId, month, year);
    const totalIncome = Number(summary.totalIncome);
    const totalExpense = Number(summary.totalExpense);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      month,
      year,
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate: Math.round(savingsRate * 100) / 100,
      transactionCount: summary.transactionCount,
    };
  }

  async getCategoryBreakdown(
    userId: string,
    startDate: string,
    endDate: string,
    type?: TransactionType,
  ) {
    const breakdown = await this.txRepo.getCategoryBreakdown(
      userId,
      new Date(startDate),
      new Date(endDate),
      type,
    );

    const total = breakdown.reduce((acc, item) => acc + Number(item.total), 0);

    return breakdown.map((item) => ({
      ...item,
      total: Number(item.total),
      percentage: total > 0 ? Math.round((Number(item.total) / total) * 10000) / 100 : 0,
    }));
  }

  async getWeeklySummary(userId: string, startDate: string, endDate: string) {
    return this.txRepo.getWeeklySummary(userId, new Date(startDate), new Date(endDate));
  }

  async getRolling3MonthAverage(userId: string) {
    const data = await this.txRepo.getRolling3MonthAverage(userId);

    if (data.length === 0) {
      return { months: [], averages: { income: 0, expense: 0, savings: 0 } };
    }

    const totals = data.reduce(
      (acc, m) => ({
        income: acc.income + m.income,
        expense: acc.expense + m.expense,
        savings: acc.savings + m.savings,
      }),
      { income: 0, expense: 0, savings: 0 },
    );

    const count = data.length;

    return {
      months: data,
      averages: {
        income: Math.round((totals.income / count) * 100) / 100,
        expense: Math.round((totals.expense / count) * 100) / 100,
        savings: Math.round((totals.savings / count) * 100) / 100,
      },
    };
  }
}
