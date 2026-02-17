export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  userId: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  categoryId: string;
  category: Pick<Category, 'id' | 'name' | 'color' | 'icon'>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string;
  category: Pick<Category, 'id' | 'name' | 'color' | 'icon'>;
  spent: number;
  remaining: number;
  usagePercentage: number;
  exceeded: boolean;
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  color: string | null;
  total: number;
  count: number;
  percentage: number;
}

export interface WeeklySummary {
  date: string;
  income: number;
  expense: number;
}

export interface RollingAverage {
  months: { month: string; income: number; expense: number; savings: number }[];
  averages: { income: number; expense: number; savings: number };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  categoryId: string;
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: TransactionType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateBudgetInput {
  amount: number;
  month: number;
  year: number;
  categoryId: string;
}
