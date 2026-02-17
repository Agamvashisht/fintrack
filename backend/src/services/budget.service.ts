import { BudgetRepository } from '../repositories/budget.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { ConflictError, NotFoundError } from '../utils/errors';

interface CreateBudgetInput {
  amount: number;
  month: number;
  year: number;
  categoryId: string;
  userId: string;
}

export class BudgetService {
  private budgetRepo: BudgetRepository;
  private categoryRepo: CategoryRepository;
  private txRepo: TransactionRepository;

  constructor() {
    this.budgetRepo = new BudgetRepository();
    this.categoryRepo = new CategoryRepository();
    this.txRepo = new TransactionRepository();
  }

  async createBudget(input: CreateBudgetInput) {
    const category = await this.categoryRepo.findById(input.categoryId, input.userId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const existing = await this.budgetRepo.findExisting(
      input.userId,
      input.categoryId,
      input.month,
      input.year,
    );
    if (existing) {
      throw new ConflictError(
        `Budget already exists for this category in ${input.month}/${input.year}`,
      );
    }

    const budget = await this.budgetRepo.create(input);
    return this.enrichBudgetWithUsage(budget, input.userId);
  }

  async getBudgets(userId: string, month: number, year: number) {
    const budgets = await this.budgetRepo.findByUserMonthYear(userId, month, year);
    const enriched = await Promise.all(
      budgets.map((b) => this.enrichBudgetWithUsage(b, userId)),
    );
    return enriched;
  }

  async getBudgetById(id: string, userId: string) {
    const budget = await this.budgetRepo.findById(id, userId);
    if (!budget) {
      throw new NotFoundError('Budget not found');
    }
    return this.enrichBudgetWithUsage(budget, userId);
  }

  async updateBudget(id: string, userId: string, amount: number) {
    const budget = await this.budgetRepo.update(id, userId, amount);
    if (!budget) {
      throw new NotFoundError('Budget not found');
    }
    return this.enrichBudgetWithUsage(budget, userId);
  }

  async deleteBudget(id: string, userId: string): Promise<void> {
    const deleted = await this.budgetRepo.delete(id, userId);
    if (!deleted) {
      throw new NotFoundError('Budget not found');
    }
  }

  private async enrichBudgetWithUsage(
    budget: { id: string; amount: unknown; month: number; year: number; categoryId: string; category: { id: string; name: string; color: string | null; icon: string | null } },
    userId: string,
  ) {
    const startDate = new Date(budget.year, budget.month - 1, 1);
    const endDate = new Date(budget.year, budget.month, 0, 23, 59, 59, 999);

    const breakdown = await this.txRepo.getCategoryBreakdown(
      userId,
      startDate,
      endDate,
      'EXPENSE',
    );

    const categorySpend = breakdown.find((b) => b.categoryId === budget.categoryId);
    const spent = categorySpend ? Number(categorySpend.total) : 0;
    const budgetAmount = Number(budget.amount);
    const remaining = budgetAmount - spent;
    const usagePercentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 10000) / 100 : 0;

    return {
      id: budget.id,
      amount: budgetAmount,
      month: budget.month,
      year: budget.year,
      category: budget.category,
      spent,
      remaining,
      usagePercentage,
      exceeded: spent > budgetAmount,
    };
  }

  async checkBudgetAlerts(userId: string): Promise<
    { categoryName: string; spent: number; budget: number; usagePercentage: number }[]
  > {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgetsWithUsage = await this.getBudgets(userId, month, year);
    return budgetsWithUsage
      .filter((b) => b.usagePercentage >= 80)
      .map((b) => ({
        categoryName: b.category.name,
        spent: b.spent,
        budget: b.amount,
        usagePercentage: b.usagePercentage,
      }));
  }
}
