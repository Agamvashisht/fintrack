import { Category } from '@prisma/client';
import prisma from '../config/database';

export class CategoryRepository {
  async create(data: {
    name: string;
    icon?: string;
    color?: string;
    userId: string;
  }): Promise<Category> {
    return prisma.category.create({ data });
  }

  async findById(id: string, userId: string): Promise<Category | null> {
    return prisma.category.findFirst({ where: { id, userId } });
  }

  async findAll(userId: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findByName(name: string, userId: string): Promise<Category | null> {
    return prisma.category.findFirst({ where: { name, userId } });
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{ name: string; icon: string; color: string }>,
  ): Promise<Category | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    return prisma.category.update({ where: { id }, data });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id, userId);
    if (!existing) return false;

    // Check if category has transactions
    const txCount = await prisma.transaction.count({ where: { categoryId: id } });
    if (txCount > 0) {
      throw new Error('Cannot delete a category that has transactions');
    }

    await prisma.category.delete({ where: { id } });
    return true;
  }

  async seedDefaultCategories(userId: string): Promise<void> {
    const defaults = [
      { name: 'Salary', icon: '💼', color: '#22c55e' },
      { name: 'Freelance', icon: '💻', color: '#3b82f6' },
      { name: 'Investments', icon: '📈', color: '#8b5cf6' },
      { name: 'Food & Dining', icon: '🍽️', color: '#f97316' },
      { name: 'Transportation', icon: '🚗', color: '#06b6d4' },
      { name: 'Housing', icon: '🏠', color: '#ec4899' },
      { name: 'Entertainment', icon: '🎬', color: '#f59e0b' },
      { name: 'Healthcare', icon: '⚕️', color: '#ef4444' },
      { name: 'Shopping', icon: '🛍️', color: '#a855f7' },
      { name: 'Utilities', icon: '⚡', color: '#6b7280' },
      { name: 'Education', icon: '📚', color: '#0ea5e9' },
      { name: 'Other', icon: '📦', color: '#9ca3af' },
    ];

    await prisma.category.createMany({
      data: defaults.map((c) => ({ ...c, userId })),
      skipDuplicates: true,
    });
  }
}
