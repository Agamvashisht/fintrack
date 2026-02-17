import api from './client';
import type {
  ApiResponse,
  User,
  Transaction,
  TransactionFilters,
  CreateTransactionInput,
  UpdateTransactionInput,
  Budget,
  CreateBudgetInput,
  Category,
  MonthlySummary,
  CategoryBreakdown,
  WeeklySummary,
  RollingAverage,
  PaginationMeta,
} from '@/types';

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    const res = await api.post<ApiResponse<{ user: User; accessToken: string }>>(
      '/auth/register',
      data,
    );
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post<ApiResponse<{ user: User; accessToken: string }>>(
      '/auth/login',
      data,
    );
    return res.data;
  },

  logout: async () => {
    const res = await api.post<ApiResponse<null>>('/auth/logout');
    return res.data;
  },

  refresh: async () => {
    const res = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    return res.data;
  },

  getMe: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },
};

// ─── Transactions ──────────────────────────────────────────────────────────

export const transactionApi = {
  getAll: async (filters: TransactionFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    const res = await api.get<ApiResponse<Transaction[]> & { meta: PaginationMeta }>(
      `/transactions?${params}`,
    );
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return res.data;
  },

  create: async (data: CreateTransactionInput) => {
    const res = await api.post<ApiResponse<Transaction>>('/transactions', data);
    return res.data;
  },

  update: async (id: string, data: UpdateTransactionInput) => {
    const res = await api.put<ApiResponse<Transaction>>(`/transactions/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/transactions/${id}`);
  },

  getMonthlySummary: async (month: number, year: number) => {
    const res = await api.get<ApiResponse<MonthlySummary>>(
      `/transactions/summary/monthly?month=${month}&year=${year}`,
    );
    return res.data;
  },

  getCategoryBreakdown: async (startDate: string, endDate: string, type?: string) => {
    const params = new URLSearchParams({ startDate, endDate });
    if (type) params.append('type', type);
    const res = await api.get<ApiResponse<CategoryBreakdown[]>>(
      `/transactions/summary/category-breakdown?${params}`,
    );
    return res.data;
  },

  getWeeklySummary: async (startDate: string, endDate: string) => {
    const res = await api.get<ApiResponse<WeeklySummary[]>>(
      `/transactions/summary/weekly?startDate=${startDate}&endDate=${endDate}`,
    );
    return res.data;
  },

  getRollingAverage: async () => {
    const res = await api.get<ApiResponse<RollingAverage>>(
      '/transactions/summary/rolling-average',
    );
    return res.data;
  },
};

// ─── Budgets ───────────────────────────────────────────────────────────────

export const budgetApi = {
  getAll: async (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const res = await api.get<ApiResponse<Budget[]>>(`/budgets?${params}`);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Budget>>(`/budgets/${id}`);
    return res.data;
  },

  create: async (data: CreateBudgetInput) => {
    const res = await api.post<ApiResponse<Budget>>('/budgets', data);
    return res.data;
  },

  update: async (id: string, amount: number) => {
    const res = await api.put<ApiResponse<Budget>>(`/budgets/${id}`, { amount });
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/budgets/${id}`);
  },
};

// ─── Categories ────────────────────────────────────────────────────────────

export const categoryApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return res.data;
  },

  create: async (data: { name: string; icon?: string; color?: string }) => {
    const res = await api.post<ApiResponse<Category>>('/categories', data);
    return res.data;
  },

  update: async (id: string, data: Partial<{ name: string; icon: string; color: string }>) => {
    const res = await api.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/categories/${id}`);
  },
};
