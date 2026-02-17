import { Transaction, TransactionType, Prisma } from '@prisma/client';
import prisma from '../config/database';

export interface TransactionFilter {
  userId: string;
  type?: TransactionType;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionWithCategory extends Transaction {
  category: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  };
}

export class TransactionRepository {
  async create(data: {
    amount: number;
    type: TransactionType;
    description: string;
    date: Date;
    userId: string;
    categoryId: string;
  }): Promise<TransactionWithCategory> {
    return prisma.transaction.create({
      data,
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });
  }

  async findById(id: string, userId: string): Promise<TransactionWithCategory | null> {
    return prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });
  }

  async findMany(
    filter: TransactionFilter,
    pagination: PaginationOptions,
  ): Promise<{ transactions: TransactionWithCategory[]; total: number }> {
    const where: Prisma.TransactionWhereInput = {
      userId: filter.userId,
      ...(filter.type && { type: filter.type }),
      ...(filter.categoryId && { categoryId: filter.categoryId }),
      ...(filter.startDate || filter.endDate
        ? {
            date: {
              ...(filter.startDate && { gte: filter.startDate }),
              ...(filter.endDate && { lte: filter.endDate }),
            },
          }
        : {}),
    };

    const validSortFields = ['date', 'amount', 'createdAt'];
    const sortBy = validSortFields.includes(pagination.sortBy ?? '')
      ? pagination.sortBy ?? 'date'
      : 'date';

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: { select: { id: true, name: true, color: true, icon: true } } },
        orderBy: { [sortBy]: pagination.sortOrder ?? 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      amount: number;
      type: TransactionType;
      description: string;
      date: Date;
      categoryId: string;
    }>,
  ): Promise<TransactionWithCategory | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    return prisma.transaction.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id, userId);
    if (!existing) return false;

    await prisma.transaction.delete({ where: { id } });
    return true;
  }

  async getMonthlySummary(
    userId: string,
    month: number,
    year: number,
  ): Promise<{ totalIncome: Prisma.Decimal; totalExpense: Prisma.Decimal; transactionCount: number }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const income = result.find((r) => r.type === 'INCOME')?._sum.amount ?? new Prisma.Decimal(0);
    const expense = result.find((r) => r.type === 'EXPENSE')?._sum.amount ?? new Prisma.Decimal(0);
    const count = result.reduce((acc, r) => acc + r._count.id, 0);

    return { totalIncome: income, totalExpense: expense, transactionCount: count };
  }

  async getCategoryBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
    type?: TransactionType,
  ): Promise<{ categoryId: string; categoryName: string; color: string | null; total: Prisma.Decimal; count: number }[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
        ...(type && { type }),
      },
      include: { category: true },
    });

    const breakdown = transactions.reduce(
      (acc, tx) => {
        const key = tx.categoryId;
        if (!acc[key]) {
          acc[key] = {
            categoryId: tx.category.id,
            categoryName: tx.category.name,
            color: tx.category.color,
            total: new Prisma.Decimal(0),
            count: 0,
          };
        }
        acc[key].total = acc[key].total.add(tx.amount);
        acc[key].count += 1;
        return acc;
      },
      {} as Record<
        string,
        {
          categoryId: string;
          categoryName: string;
          color: string | null;
          total: Prisma.Decimal;
          count: number;
        }
      >,
    );

    return Object.values(breakdown).sort((a, b) => b.total.comparedTo(a.total));
  }

  async getWeeklySummary(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ date: string; income: number; expense: number }[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, type: true, amount: true },
      orderBy: { date: 'asc' },
    });

    const dailyMap = new Map<string, { income: number; expense: number }>();

    transactions.forEach((tx) => {
      const dateKey = tx.date.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { income: 0, expense: 0 });
      }
      const day = dailyMap.get(dateKey)!;
      if (tx.type === 'INCOME') {
        day.income += Number(tx.amount);
      } else {
        day.expense += Number(tx.amount);
      }
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  async getRolling3MonthAverage(userId: string): Promise<{
    month: string;
    income: number;
    expense: number;
    savings: number;
  }[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true, type: true, amount: true },
      orderBy: { date: 'asc' },
    });

    const monthlyMap = new Map<string, { income: number; expense: number }>();

    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { income: 0, expense: 0 });
      }
      const month = monthlyMap.get(key)!;
      if (tx.type === 'INCOME') {
        month.income += Number(tx.amount);
      } else {
        month.expense += Number(tx.amount);
      }
    });

    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        savings: data.income - data.expense,
      }));
  }

  async findAllForSummary(userId: string, startDate: Date, endDate: Date): Promise<{ type: TransactionType; amount: Prisma.Decimal }[]> {
    return prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      select: { type: true, amount: true },
    });
  }
}
