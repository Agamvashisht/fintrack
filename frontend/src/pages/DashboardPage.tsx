import React, { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useMonthlySummary, useCategoryBreakdown, useWeeklySummary, useRollingAverage } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useAuth } from '@/context/AuthContext';
import { Card, Skeleton, ProgressBar } from '@/components/ui';
import { formatCurrency } from '@/utils/formatters';

const CHART_COLORS = ['#6ee7b7', '#60a5fa', '#f59e0b', '#f87171', '#a78bfa', '#34d399', '#fb923c'];

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  change,
  color,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: string;
  color: string;
  isLoading?: boolean;
}) => (
  <Card className="flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${color}/10`}>
        <Icon size={16} className={`text-${color}`} />
      </div>
      {change && <span className="text-xs text-text-muted">{change}</span>}
    </div>
    {isLoading ? (
      <Skeleton className="h-7 w-28" />
    ) : (
      <div>
        <p className="text-2xl font-display font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary mt-0.5">{label}</p>
      </div>
    )}
  </Card>
);

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-surface-3 rounded-xl p-3 shadow-xl">
      <p className="text-text-secondary text-xs mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'00:00:00.000'Z'");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'23:59:59.999'Z'");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd'T'00:00:00.000'Z'");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd'T'23:59:59.999'Z'");

  const { data: summaryData, isLoading: summaryLoading } = useMonthlySummary(month, year);
  const { data: expenseBreakdown, isLoading: breakdownLoading } = useCategoryBreakdown(monthStart, monthEnd, 'EXPENSE');
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklySummary(weekStart, weekEnd);
  const { data: rollingData } = useRollingAverage();
  const { data: budgetsData, isLoading: budgetsLoading } = useBudgets(month, year);

  const summary = summaryData?.data;
  const breakdown = expenseBreakdown?.data ?? [];
  const weekly = weeklyData?.data ?? [];
  const budgets = budgetsData?.data ?? [];
  const rolling = rollingData?.data?.months ?? [];

  const weeklyChartData = useMemo(
    () =>
      weekly.map((d) => ({
        date: format(new Date(d.date), 'EEE'),
        Income: d.income,
        Expense: d.expense,
      })),
    [weekly],
  );

  const rollingChartData = useMemo(
    () =>
      rolling.map((d) => ({
        month: format(new Date(d.month + '-01'), 'MMM'),
        Income: d.income,
        Expense: d.expense,
        Savings: d.savings,
      })),
    [rolling],
  );

  const exceededBudgets = budgets.filter((b) => b.exceeded);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="text-accent">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            {format(now, 'MMMM yyyy')} overview
          </p>
        </div>
        {exceededBudgets.length > 0 && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
            <span className="text-danger text-xs font-medium">
              {exceededBudgets.length} budget{exceededBudgets.length > 1 ? 's' : ''} exceeded
            </span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={TrendingUp}
          label="Total Income"
          value={formatCurrency(summary?.totalIncome ?? 0)}
          color="accent"
          isLoading={summaryLoading}
        />
        <SummaryCard
          icon={TrendingDown}
          label="Total Expenses"
          value={formatCurrency(summary?.totalExpense ?? 0)}
          color="danger"
          isLoading={summaryLoading}
        />
        <SummaryCard
          icon={Wallet}
          label="Net Savings"
          value={formatCurrency(summary?.netSavings ?? 0)}
          color="info"
          isLoading={summaryLoading}
        />
        <SummaryCard
          icon={PiggyBank}
          label="Savings Rate"
          value={`${summary?.savingsRate?.toFixed(1) ?? '0'}%`}
          color="accent"
          isLoading={summaryLoading}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Rolling 3-month trend */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">3-Month Trend</h3>
              <p className="text-xs text-text-muted mt-0.5">Income vs Expense overview</p>
            </div>
            <BarChart2 size={16} className="text-text-muted" />
          </div>
          {rolling.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={rollingChartData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Income" stroke="#6ee7b7" strokeWidth={2} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="Expense" stroke="#f87171" strokeWidth={2} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Category pie chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Expense Breakdown</h3>
              <p className="text-xs text-text-muted mt-0.5">By category this month</p>
            </div>
          </div>
          {breakdownLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : breakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">No data</div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={breakdown.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {breakdown.slice(0, 6).map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ background: '#1c1c1f', border: '1px solid #2c2c31', borderRadius: '12px' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {breakdown.slice(0, 4).map((item, i) => (
                  <div key={item.categoryId} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-text-secondary truncate max-w-[100px]">{item.categoryName}</span>
                    </div>
                    <span className="text-text-primary font-medium">{item.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly bar chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">This Week</h3>
              <p className="text-xs text-text-muted mt-0.5">Daily income vs expenses</p>
            </div>
          </div>
          {weeklyLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyChartData} barSize={20} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Income" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Budget indicators */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Budget Status</h3>
              <p className="text-xs text-text-muted mt-0.5">{format(now, 'MMMM yyyy')}</p>
            </div>
            <RefreshCw size={14} className="text-text-muted" />
          </div>
          {budgetsLoading ? (
            <div className="space-y-4">
              <Skeleton count={4} className="h-12" />
            </div>
          ) : budgets.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-text-muted text-sm text-center">
              <p>No budgets set yet.<br />Go to Budgets to create some.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1">
              {budgets.map((budget) => (
                <div key={budget.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-text-primary truncate max-w-[120px]">
                      {budget.category.name}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        budget.exceeded ? 'text-danger' : budget.usagePercentage > 80 ? 'text-warning' : 'text-text-secondary'
                      }`}
                    >
                      {budget.usagePercentage.toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar value={budget.usagePercentage} exceeded={budget.exceeded} />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-text-muted">{formatCurrency(budget.spent)} spent</span>
                    <span className="text-xs text-text-muted">{formatCurrency(budget.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
