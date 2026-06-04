import { btnPrimary } from "../../lib/ui-classes.ts";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      className="rounded-lg border border-negative/20 bg-negative/5 px-4 py-3 text-sm text-negative"
      role="alert"
    >
      <p className="font-medium">Error</p>
      <p className="mt-1 text-stone-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`mt-3 ${btnPrimary}`}>
          Try again
        </button>
      )}
    </div>
  );
}
