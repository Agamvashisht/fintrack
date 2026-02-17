import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import { Input, Button, Select } from '@/components/ui';
import type { Transaction, Category } from '@/types';

const transactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1, 'Description is required').max(500),
  date: z.string().min(1, 'Date is required'),
  categoryId: z.string().min(1, 'Category is required'),
});

type FormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  transaction?: Transaction | null;
  categories: Category[];
  onSuccess: () => void;
}

export const TransactionForm = ({ transaction, categories, onSuccess }: TransactionFormProps) => {
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const isEditing = !!transaction;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: transaction?.amount ?? undefined,
      type: transaction?.type ?? 'EXPENSE',
      description: transaction?.description ?? '',
      date: transaction?.date
        ? format(new Date(transaction.date), "yyyy-MM-dd'T'HH:mm")
        : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      categoryId: transaction?.categoryId ?? '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      date: new Date(data.date).toISOString(),
    };

    if (isEditing && transaction) {
      await updateMutation.mutateAsync({ id: transaction.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="label">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(['INCOME', 'EXPENSE'] as const).map((type) => (
            <label
              key={type}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-all ${
                selectedType === type
                  ? type === 'INCOME'
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-danger/10 border-danger text-danger'
                  : 'border-surface-3 text-text-secondary hover:border-surface-4'
              }`}
            >
              <input type="radio" value={type} {...register('type')} className="sr-only" />
              <span className="text-sm font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <Input
        label="Amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <Input
        label="Description"
        type="text"
        placeholder="What was this for?"
        error={errors.description?.message}
        {...register('description')}
      />

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

      <Input
        label="Date & Time"
        type="datetime-local"
        error={errors.date?.message}
        {...register('date')}
      />

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          loading={isSubmitting}
          className="flex-1"
        >
          {isEditing ? 'Update Transaction' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
};
