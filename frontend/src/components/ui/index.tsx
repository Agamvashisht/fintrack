import React, { forwardRef } from 'react';
import clsx from 'clsx';

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
    const variants = {
      primary: 'bg-accent text-surface hover:bg-accent/90',
      secondary: 'bg-surface-3 text-text-primary hover:bg-surface-4',
      danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20',
      ghost: 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
    };
    const sizes = {
      sm: 'text-xs px-3 py-1.5',
      md: 'text-sm px-4 py-2.5',
      lg: 'text-base px-6 py-3',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        ) : leftIcon}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'input',
              leftIcon && 'pl-10',
              error && 'border-danger/50 focus:ring-danger/20 focus:border-danger/50',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx('input appearance-none cursor-pointer', error && 'border-danger/50', className)}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-2">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card = ({ elevated, className, children, ...props }: CardProps) => (
  <div className={clsx(elevated ? 'card-elevated' : 'card', 'p-5', className)} {...props}>
    {children}
  </div>
);

// ─── Badge ───────────────────────────────────────────────────────────────────

interface BadgeProps {
  type: 'INCOME' | 'EXPENSE';
  className?: string;
}

export const TypeBadge = ({ type, className }: BadgeProps) => (
  <span className={clsx(type === 'INCOME' ? 'badge-income' : 'badge-expense', className)}>
    {type === 'INCOME' ? '+' : '-'} {type}
  </span>
);

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!isOpen) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={clsx('modal-content w-full card-elevated', sizes[size])}>
        <div className="flex items-center justify-between p-5 border-b border-surface-3">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-3 hover:text-text-primary transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton = ({ className, count = 1 }: SkeletonProps) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className={clsx(
          'shimmer rounded-xl h-4',
          className,
        )}
      />
    ))}
  </>
);

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center text-text-muted">
      {icon}
    </div>
    <div>
      <p className="text-text-primary font-medium">{title}</p>
      {description && <p className="text-text-secondary text-sm mt-1">{description}</p>}
    </div>
    {action}
  </div>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0-100
  exceeded?: boolean;
  className?: string;
}

export const ProgressBar = ({ value, exceeded, className }: ProgressBarProps) => (
  <div className={clsx('w-full h-1.5 bg-surface-3 rounded-full overflow-hidden', className)}>
    <div
      className={clsx(
        'h-full rounded-full transition-all duration-500',
        exceeded ? 'bg-danger' : value > 80 ? 'bg-warning' : 'bg-accent',
      )}
      style={{ width: `${Math.min(value, 100)}%` }}
    />
  </div>
);
