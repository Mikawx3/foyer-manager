import { Loader2, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useSwipeToClose } from "../../hooks/useSwipeToClose.ts";
import { bottomSheetPanel, btnSecondary, iconBtn } from "../../lib/ui-classes.ts";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const confirmButtonClass: Record<"danger" | "warning", string> = {
  danger:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-base font-medium text-white hover:bg-red-700 active:scale-[0.98] active:opacity-90 disabled:opacity-50 md:text-sm",
  warning:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-base font-medium text-white hover:bg-amber-700 active:scale-[0.98] active:opacity-90 disabled:opacity-50 md:text-sm",
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const { panelStyle, swipeHandlers } = useSwipeToClose(onCancel, isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
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
        className={`${bottomSheetPanel} md:max-w-md`}
        style={panelStyle}
      >
        <div
          className="shrink-0 cursor-grab touch-none active:cursor-grabbing md:hidden"
          {...swipeHandlers}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-300" aria-hidden />
        </div>
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:border-0 md:px-6 md:pt-6 md:pb-0">
          <h2 id={titleId} className="font-semibold text-stone-900">
            {title}
          </h2>
          <button type="button" onClick={onCancel} className={`${iconBtn} md:hidden`} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 pb-4 md:px-6 md:pb-6">
          <p id={messageId} className="mt-1 text-base text-stone-600 md:text-sm">
            {message}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:flex-wrap md:justify-end">
            <button
              ref={cancelButtonRef}
              type="button"
              className={`${btnSecondary} w-full md:w-auto`}
              disabled={isLoading}
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`${confirmButtonClass[variant]} w-full md:w-auto`}
              disabled={isLoading}
              onClick={onConfirm}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
