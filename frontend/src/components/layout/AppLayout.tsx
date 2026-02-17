import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  User2,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/budgets', label: 'Budgets', icon: Target },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside
        className={clsx(
          'flex flex-col bg-surface-1 border-r border-surface-3 transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        {/* Logo */}
        <div className={clsx('flex items-center h-16 px-4 border-b border-surface-3', !collapsed && 'gap-3')}>
          <div className="flex-shrink-0 w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <TrendingUp size={16} className="text-surface font-bold" />
          </div>
          {!collapsed && (
            <span className="font-display font-semibold text-text-primary tracking-tight text-lg">
              FinTrack
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={clsx(
                  'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  collapsed ? 'justify-center' : 'gap-3',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-4 border-t border-surface-3 space-y-1">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className={clsx(
              'w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary',
              'hover:bg-surface-2 hover:text-text-primary transition-all duration-150',
              collapsed ? 'justify-center' : 'gap-3',
            )}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <button
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            className={clsx(
              'w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary',
              'hover:bg-danger/10 hover:text-danger transition-all duration-150',
              collapsed ? 'justify-center' : 'gap-3',
            )}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-surface-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <User2 size={14} className="text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute bottom-24 -right-3 w-6 h-6 bg-surface-3 border border-surface-4 rounded-full flex items-center justify-center hover:bg-surface-4 transition-colors text-text-secondary"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};
