import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  sectionName?: string;
  compact?: boolean;
  onReset?: () => void;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(
      `[BAD HABIT] ErrorBoundary caught error${this.props.sectionName ? ` (${this.props.sectionName})` : ''}:`,
      error?.message || error,
      info?.componentStack
    );
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      if (this.props.compact) {
        return (
          <div className="w-full h-full min-h-[220px] bg-[#1f486d]/90 text-white flex flex-col items-center justify-center p-6 text-center rounded-2xl border border-white/20 backdrop-blur-xl">
            <span className="font-display text-sm font-black tracking-[0.14em] uppercase mb-1.5">
              BAD HABIT{this.props.sectionName ? ` · ${this.props.sectionName}` : ''}
            </span>
            <p className="text-xs font-display text-white/80 max-w-sm mb-4">
              This section encountered a temporary issue.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-full bg-white text-slate-900 font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Retry Section
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Reload
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen w-full bg-[#1f486d] text-white flex flex-col items-center justify-center p-6 text-center">
          <span className="font-display text-2xl font-black tracking-[0.14em] uppercase mb-2">
            BAD HABIT
          </span>
          <p className="text-sm font-display text-white/85 max-w-md mb-6">
            Something went wrong while loading this view. Please retry or reload to continue browsing.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-6 py-2.5 rounded-full bg-white text-slate-900 font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-full bg-white/15 border border-white/30 text-white font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Reload Showroom
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
