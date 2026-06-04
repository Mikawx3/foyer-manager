import { Component, type ErrorInfo, type ReactNode } from "react";
import { btnPrimary } from "../../lib/ui-classes.ts";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Uncaught error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Something went wrong
          </h1>
          <p className="mt-2 max-w-md text-sm text-stone-600">
            An unexpected error occurred. Reload the page to try again.
          </p>
          <button
            type="button"
            className={`${btnPrimary} mt-8`}
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
