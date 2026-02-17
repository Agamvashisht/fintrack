import React, { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Target, AlertTriangle } from 'lucide-react';
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useBudgets';
import { Button, Card, Modal, EmptyState, ProgressBar, Skeleton } from '@/components/ui';
import { formatCurrency } from '@/utils/formatters';
import { BudgetForm } from '@/components/forms/BudgetForm';
import type { Budget } from '@/types';

export const BudgetsPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data, isLoading } = useBudgets(month, year);
  const { data: categoriesData } = useCategories();
  const deleteMutation = useDeleteBudget();

  const budgets = data?.data ?? [];
  const categories = categoriesData?.data ?? [];

  const totalBudgeted = budgets.reduce((acc, b) => acc + b.amount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const overallUsage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const exceededCount = budgets.filter((b) => b.exceeded).length;

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this budget?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBudget(null);
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Budgets</h1>
          <p className="text-text-secondary text-sm mt-0.5">Monthly spending limits by category</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)} leftIcon={<Plus size={14} />}>
          New Budget
        </Button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate((d) => subMonths(d, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-text-primary px-2">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate((d) => addMonths(d, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Overview */}
      {!isLoading && budgets.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Total Budget Usage</p>
              <p className="text-xs text-text-muted mt-0.5">
                {formatCurrency(totalSpent)} of {formatCurrency(totalBudgeted)} spent
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-display font-bold ${overallUsage > 100 ? 'text-danger' : overallUsage > 80 ? 'text-warning' : 'text-accent'}`}>
                {overallUsage.toFixed(0)}%
              </p>
              {exceededCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-danger mt-0.5">
                  <AlertTriangle size={10} />
                  <span>{exceededCount} exceeded</span>
                </div>
              )}
            </div>
          </div>
          <ProgressBar value={overallUsage} exceeded={overallUsage > 100} className="h-2" />
        </Card>
      )}

      {/* Budget grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-36">
              <Skeleton className="h-5 w-24 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </Card>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target size={24} />}
            title="No budgets set"
            description={`Set monthly budgets for ${format(currentDate, 'MMMM')} to track your spending`}
            action={
              <Button size="sm" onClick={() => setShowModal(true)} leftIcon={<Plus size={14} />}>
                Create Budget
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <Card
              key={budget.id}
              className={`relative ${budget.exceeded ? 'border-danger/30' : ''}`}
            >
              {budget.exceeded && (
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1 bg-danger/10 border border-danger/20 rounded-full px-2 py-0.5">
                    <AlertTriangle size={10} className="text-danger" />
                    <span className="text-[10px] text-danger font-medium">Exceeded</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: (budget.category.color ?? '#52525b') + '20' }}
                >
                  {budget.category.icon ?? '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">
                    {budget.category.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatCurrency(budget.amount)} budget
                  </p>
                </div>
              </div>

              <ProgressBar
                value={budget.usagePercentage}
                exceeded={budget.exceeded}
                className="mb-3"
              />

              <div className="flex items-center justify-between text-xs">
                <div>
                  <span
                    className={`font-semibold ${
                      budget.exceeded ? 'text-danger' : budget.usagePercentage > 80 ? 'text-warning' : 'text-text-primary'
                    }`}
                  >
                    {formatCurrency(budget.spent)}
                  </span>
                  <span className="text-text-muted"> spent</span>
                </div>
                <div>
                  <span className={budget.remaining < 0 ? 'text-danger font-medium' : 'text-text-secondary'}>
                    {budget.remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(budget.remaining))} {budget.remaining < 0 ? 'over' : 'left'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-surface-3">
                <button
                  onClick={() => handleEdit(budget)}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <span className="text-surface-4 mx-1">·</span>
                <button
                  onClick={() => handleDelete(budget.id)}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-danger transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingBudget ? 'Edit Budget' : 'New Budget'}
        size="sm"
      >
        <BudgetForm
          budget={editingBudget}
          categories={categories}
          month={month}
          year={year}
          onSuccess={handleCloseModal}
        />
      </Modal>
    </div>
  );
};
