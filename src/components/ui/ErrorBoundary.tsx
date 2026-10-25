import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Enterprise Medical Station Error Boundary.
 * Catches unhandled runtime exceptions in clinical modules and prevents
 * white-screen crashes, providing station recovery mechanisms and diagnostics.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Clinical UI Exception Caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Station Temporarily Unavailable';
      const message =
        this.props.fallbackMessage ||
        'A client runtime exception occurred in this workstation module. Clinical state in database remains safe.';

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="p-6 my-4 bg-surface dark:bg-night-900 border-2 border-rose-500 rounded-none shadow-xl text-ink dark:text-white font-sans max-w-2xl mx-auto animate-fadeIn"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-none shrink-0">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="type-section-title text-rose-800 dark:text-rose-300 font-bold">
                {title}
              </h3>
              <p className="text-xs text-muted dark:text-teal-100 leading-relaxed">
                {message}
              </p>

              {this.state.error && (
                <div className="mt-3 p-3 bg-surface-muted dark:bg-night-950 border border-line dark:border-white/10 font-mono text-2xs text-rose-600 dark:text-rose-400 overflow-x-auto rounded-none">
                  <span className="font-bold">Error:</span> {this.state.error.message}
                </div>
              )}

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="btn-primary text-xs px-4 py-2 rounded-none inline-flex items-center gap-2 font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Retry Station</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="btn-secondary text-xs px-4 py-2 rounded-none inline-flex items-center gap-2 font-bold cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reload Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
