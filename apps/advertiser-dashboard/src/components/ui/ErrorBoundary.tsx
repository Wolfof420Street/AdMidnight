/**
 * ErrorBoundary — prevents full page crashes from propagating.
 * SRP: error containment is a cross-cutting concern, not a page concern.
 */
'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  message?: string;
}
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
          <div className="mb-2 font-semibold">{this.props.title ?? 'Something went wrong'}</div>
          <div className="max-w-xl text-red-100/80">
            {this.props.message ?? 'The dashboard hit an unexpected error. No sensitive details were exposed. Please retry or return to the dashboard.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-md border border-red-200/30 px-3 py-1.5 text-xs font-semibold text-red-50 transition-colors hover:bg-red-200/10"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
