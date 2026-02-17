import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { transactionApi } from '@/api/services';
import type { TransactionFilters, CreateTransactionInput, UpdateTransactionInput } from '@/types';
import toast from 'react-hot-toast';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTION_KEYS.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...TRANSACTION_KEYS.lists(), filters] as const,
  details: () => [...TRANSACTION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRANSACTION_KEYS.details(), id] as const,
  summary: {
    monthly: (month: number, year: number) =>
      [...TRANSACTION_KEYS.all, 'summary', 'monthly', month, year] as const,
    weekly: (start: string, end: string) =>
      [...TRANSACTION_KEYS.all, 'summary', 'weekly', start, end] as const,
    category: (start: string, end: string, type?: string) =>
      [...TRANSACTION_KEYS.all, 'summary', 'category', start, end, type] as const,
    rolling: () => [...TRANSACTION_KEYS.all, 'summary', 'rolling'] as const,
  },
};

export const useTransactions = (filters: TransactionFilters = {}) => {
  return useQuery({
    queryKey: TRANSACTION_KEYS.list(filters),
    queryFn: () => transactionApi.getAll(filters),
    placeholderData: keepPreviousData,
  });
};

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: TRANSACTION_KEYS.detail(id),
    queryFn: () => transactionApi.getById(id),
    enabled: !!id,
  });
};

export const useMonthlySummary = (month: number, year: number) => {
  return useQuery({
    queryKey: TRANSACTION_KEYS.summary.monthly(month, year),
    queryFn: () => transactionApi.getMonthlySummary(month, year),
    enabled: !!month && !!year,
  });
};

export const useCategoryBreakdown = (startDate: string, endDate: string, type?: string) => {
  return useQuery({
    queryKey: TRANSACTION_KEYS.summary.category(startDate, endDate, type),
    queryFn: () => transactionApi.getCategoryBreakdown(startDate, endDate, type),
    enabled: !!startDate && !!endDate,
  });
};

export const useWeeklySummary = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: TRANSACTION_KEYS.summary.weekly(startDate, endDate),
    queryFn: () => transactionApi.getWeeklySummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};

export const useRollingAverage = () => {
  return useQuery({
    queryKey: TRANSACTION_KEYS.summary.rolling(),
    queryFn: () => transactionApi.getRollingAverage(),
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      toast.success('Transaction added!');
    },
    onError: () => {
      toast.error('Failed to add transaction');
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) =>
      transactionApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.detail(id) });
      toast.success('Transaction updated!');
    },
    onError: () => {
      toast.error('Failed to update transaction');
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      toast.success('Transaction deleted');
    },
    onError: () => {
      toast.error('Failed to delete transaction');
    },
  });
};
