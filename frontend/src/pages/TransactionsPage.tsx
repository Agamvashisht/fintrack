import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Search, Filter, Download, ChevronLeft, ChevronRight, Pencil, Trash2, ArrowLeftRight } from 'lucide-react';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useBudgets';
import { Button, Card, TypeBadge, EmptyState, Skeleton, Modal } from '@/components/ui';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { formatCurrency } from '@/utils/formatters';
import type { Transaction, TransactionFilters } from '@/types';

export const TransactionsPage = () => {
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 15,
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useTransactions(filters);
  const { data: categoriesData } = useCategories();
  const deleteMutation = useDeleteTransaction();

  const transactions = data?.data ?? [];
  const meta = data?.meta;
  const categories = categoriesData?.data ?? [];

  const filteredTransactions = useMemo(
    () =>
      transactions.filter(
        (tx) =>
          !search ||
          tx.description.toLowerCase().includes(search.toLowerCase()) ||
          tx.category.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [transactions, search],
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTx(null);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map((tx) => [
      format(new Date(tx.date), 'yyyy-MM-dd'),
      `"${tx.description}"`,
      tx.category.name,
      tx.type,
      tx.type === 'INCOME' ? tx.amount : -tx.amount,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Transactions</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {meta?.total ?? 0} total transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={exportToCSV} leftIcon={<Download size={14} />}>
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)} leftIcon={<Plus size={14} />}>
            Add
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              className="input pl-9 h-9 text-sm"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            leftIcon={<Filter size={14} />}
          >
            Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-surface-3 animate-slide-down">
            <div>
              <label className="label">Type</label>
              <select
                className="input text-sm h-9"
                value={filters.type ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    type: (e.target.value as 'INCOME' | 'EXPENSE') || undefined,
                    page: 1,
                  }))
                }
              >
                <option value="">All types</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            <div>
              <label className="label">Category</label>
              <select
                className="input text-sm h-9"
                value={filters.categoryId ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, categoryId: e.target.value || undefined, page: 1 }))
                }
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">From</label>
              <input
                type="date"
                className="input text-sm h-9"
                value={filters.startDate?.split('T')[0] ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    startDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
                    page: 1,
                  }))
                }
              />
            </div>

            <div>
              <label className="label">To</label>
              <input
                type="date"
                className="input text-sm h-9"
                value={filters.endDate?.split('T')[0] ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    endDate: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
                    page: 1,
                  }))
                }
              />
            </div>
          </div>
        )}
      </Card>

      {/* Transaction list */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight size={24} />}
            title="No transactions found"
            description={search ? 'Try adjusting your search' : 'Add your first transaction to get started'}
            action={
              <Button size="sm" onClick={() => setShowModal(true)} leftIcon={<Plus size={14} />}>
                Add Transaction
              </Button>
            }
          />
        ) : (
          <>
            <div className="divide-y divide-surface-3">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-2/50 transition-colors group"
                >
                  {/* Category icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: (tx.category.color ?? '#52525b') + '20' }}
                  >
                    {tx.category.icon ?? '📦'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">
                        {format(new Date(tx.date), 'MMM d, yyyy')}
                      </span>
                      <span className="text-text-muted/40">·</span>
                      <span className="text-xs text-text-muted">{tx.category.name}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold font-mono ${
                        tx.type === 'INCOME' ? 'text-accent' : 'text-text-primary'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <TypeBadge type={tx.type} className="mt-0.5 text-[10px]" />
                  </div>

                  {/* Actions (show on hover) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(tx)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-3 hover:text-text-primary transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-danger/10 hover:text-danger transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-surface-3">
                <span className="text-xs text-text-muted">
                  Page {meta.page} of {meta.totalPages} · {meta.total} total
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={meta.page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={meta.page >= meta.totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingTx ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          transaction={editingTx}
          categories={categories}
          onSuccess={handleCloseModal}
        />
      </Modal>
    </div>
  );
};
