import { Budget, Prisma } from '@prisma/client';
import prisma from '../config/database';

export interface BudgetWithCategory extends Budget {
  category: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  };
}

export class BudgetRepository {
  async create(data: {
    amount: number;
    month: number;
    year: number;
    userId: string;
    categoryId: string;
  }): Promise<BudgetWithCategory> {
    return prisma.budget.create({
      data,
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });
  }

  async findById(id: string, userId: string): Promise<BudgetWithCategory | null> {
    return prisma.budget.findFirst({
      where: { id, userId },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });
  }

  async findByUserMonthYear(
    userId: string,
    month: number,
    year: number,
  ): Promise<BudgetWithCategory[]> {
    return prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
      orderBy: { category: { name: 'asc' } },
    });
  }

  async findExisting(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
  ): Promise<Budget | null> {
    return prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: { userId, categoryId, month, year },
      },
    });
  }

  async update(id: string, userId: string, amount: number): Promise<BudgetWithCategory | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    return prisma.budget.update({
      where: { id },
      data: { amount },
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id, userId);
    if (!existing) return false;

    await prisma.budget.delete({ where: { id } });
    return true;
  }

  async findAllActiveForCurrentMonth(): Promise<
    { userId: string; categoryId: string; amount: Prisma.Decimal; categoryName: string }[]
  > {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgets = await prisma.budget.findMany({
      where: { month, year },
      include: { category: true },
      select: {
        userId: true,
        categoryId: true,
        amount: true,
        category: { select: { name: true } },
      },
    });

    return budgets.map((b) => ({
      userId: b.userId,
      categoryId: b.categoryId,
      amount: b.amount,
      categoryName: b.category.name,
    }));
  }
}
