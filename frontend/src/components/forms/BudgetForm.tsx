import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateBudget, useUpdateBudget } from '@/hooks/useBudgets';
import { Input, Button } from '@/components/ui';
import type { Budget, Category } from '@/types';

const budgetSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
});

type FormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  budget?: Budget | null;
  categories: Category[];
  month: number;
  year: number;
  onSuccess: () => void;
}

export const BudgetForm = ({ budget, categories, month, year, onSuccess }: BudgetFormProps) => {
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const isEditing = !!budget;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: budget?.amount ?? undefined,
      categoryId: budget?.categoryId ?? '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (isEditing && budget) {
      await updateMutation.mutateAsync({ id: budget.id, amount: data.amount });
    } else {
      await createMutation.mutateAsync({
        ...data,
        month,
        year,
      });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!isEditing && (
        <div>
          <label className="label">Category</label>
          <select
            className={`input ${errors.categoryId ? 'border-danger/50' : ''}`}
            {...register('categoryId')}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-surface-2">
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1.5 text-xs text-danger">{errors.categoryId.message}</p>}
        </div>
      )}

      {isEditing && (
        <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-xl">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
            style={{ background: (budget.category.color ?? '#52525b') + '20' }}
          >
            {budget.category.icon ?? '📦'}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{budget.category.name}</p>
            <p className="text-xs text-text-muted">Editing budget</p>
          </div>
        </div>
      )}

      <Input
        label="Monthly Budget Amount"
        type="number"
        step="0.01"
        placeholder="500.00"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <Button type="submit" loading={isSubmitting} className="w-full">
        {isEditing ? 'Update Budget' : 'Create Budget'}
      </Button>
    </form>
  );
};
