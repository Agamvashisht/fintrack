import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
          <div className="max-w-md w-full card p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} className="text-danger" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Something went wrong</h2>
              <p className="text-text-secondary text-sm mt-2">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              {this.state.error && (
                <p className="text-xs text-text-muted mt-2 font-mono bg-surface-2 rounded-lg p-3 text-left">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
