import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#1f486d] text-white flex flex-col items-center justify-center p-6 text-center">
          <span className="font-display text-2xl font-black tracking-[0.14em] uppercase mb-2">
            BAD HABIT
          </span>
          <p className="text-sm font-display text-white/85 max-w-md mb-6">
            Something went wrong while loading this view. Please reload to continue browsing.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-full bg-white text-slate-900 font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Reload Showroom
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
