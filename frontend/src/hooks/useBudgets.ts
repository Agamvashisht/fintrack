import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetApi, categoryApi } from '@/api/services';
import type { CreateBudgetInput } from '@/types';
import toast from 'react-hot-toast';

export const BUDGET_KEYS = {
  all: ['budgets'] as const,
  list: (month?: number, year?: number) => [...BUDGET_KEYS.all, month, year] as const,
};

export const CATEGORY_KEYS = {
  all: ['categories'] as const,
};

// ─── Budget Hooks ────────────────────────────────────────────────────────────

export const useBudgets = (month?: number, year?: number) => {
  return useQuery({
    queryKey: BUDGET_KEYS.list(month, year),
    queryFn: () => budgetApi.getAll(month, year),
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetInput) => budgetApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.all });
      toast.success('Budget created!');
    },
    onError: () => toast.error('Failed to create budget'),
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => budgetApi.update(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.all });
      toast.success('Budget updated!');
    },
    onError: () => toast.error('Failed to update budget'),
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGET_KEYS.all });
      toast.success('Budget deleted');
    },
    onError: () => toast.error('Failed to delete budget'),
  });
};

// ─── Category Hooks ──────────────────────────────────────────────────────────

export const useCategories = () => {
  return useQuery({
    queryKey: CATEGORY_KEYS.all,
    queryFn: () => categoryApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; icon?: string; color?: string }) =>
      categoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      toast.success('Category created!');
    },
    onError: () => toast.error('Failed to create category'),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      toast.success('Category deleted');
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error ? error.message : 'Failed to delete category';
      toast.error(msg);
    },
  });
};
