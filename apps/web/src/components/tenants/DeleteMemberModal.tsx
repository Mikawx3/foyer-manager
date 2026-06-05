import { Loader2 } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import type { TenantRemovalPreview } from "../../lib/api.ts";
import { formatSignedCurrency } from "../../lib/format.ts";
import { btnSecondary } from "../../lib/ui-classes.ts";

interface DeleteMemberModalProps {
  isOpen: boolean;
  householdId: string;
  memberName: string;
  preview: TenantRemovalPreview | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteMemberModal({
  isOpen,
  householdId,
  memberName,
  preview,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteMemberModalProps) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const hasNonZeroBalance = preview !== null && Math.abs(preview.balance) > 0.005;
  const isBlocked = hasNonZeroBalance;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCancel]);

  if (!isOpen || !preview) {
    return null;
  }

  let title = "Remove member permanently";
  let message = `${memberName} has no expense history. They will be permanently deleted. Continue?`;
  let confirmLabel = "Delete permanently";

  if (isBlocked) {
    title = "Cannot remove member";
    message = `${memberName} has an outstanding balance of ${formatSignedCurrency(preview.balance)}. Settle up before removing.`;
  } else if (preview.hasHistory) {
    title = "Archive member";
    message = `${memberName} will be archived. Their expense history will be preserved and their name will remain on past expenses.`;
    confirmLabel = "Archive";
  }

  const soloWarning = preview.wouldSwitchToSolo
    ? `${memberName} is the last other member. The household will switch to solo mode.`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onCancel}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="relative z-10 w-full max-w-md rounded-xl bg-surface p-6 shadow-lg"
      >
        <h2 id={titleId} className="font-semibold text-stone-900">
          {title}
        </h2>
        <p id={messageId} className="mt-2 text-sm text-stone-600">
          {message}
        </p>
        {!isBlocked && soloWarning && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {soloWarning}
          </p>
        )}
        {isBlocked && (
          <Link
            to={`/households/${householdId}/balances`}
            className="mt-4 inline-flex text-sm font-medium text-primary hover:text-primary-hover"
            onClick={onCancel}
          >
            Go to balances →
          </Link>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            className={btnSecondary}
            disabled={isLoading}
            onClick={onCancel}
          >
            {isBlocked ? "Close" : "Cancel"}
          </button>
          {!isBlocked && (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              disabled={isLoading}
              onClick={onConfirm}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
