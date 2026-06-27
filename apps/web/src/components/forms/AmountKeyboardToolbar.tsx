import { Check } from "lucide-react";
import { type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

interface AmountKeyboardToolbarProps {
  visible: boolean;
  keyboardInset: number;
  previewLabel?: string | null;
  onAdd: () => void;
  onSubtract: () => void;
  onSplit: () => void;
  onConfirm: () => void;
}

function preventInputBlur(event: PointerEvent<HTMLButtonElement>) {
  event.preventDefault();
}

export function AmountKeyboardToolbar({
  visible,
  keyboardInset,
  previewLabel,
  onAdd,
  onSubtract,
  onSplit,
  onConfirm,
}: AmountKeyboardToolbarProps) {
  const { t } = useTranslation("common");

  return createPortal(
    <div
      role="toolbar"
      aria-label={t("amountToolbarLabel")}
      aria-hidden={!visible}
      className={`fixed inset-x-0 z-[60] h-14 border-t border-border bg-surface shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-[bottom,transform,opacity] duration-200 ease-out ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ bottom: keyboardInset }}
    >
      <div className="flex h-full items-center gap-1 px-2">
        {previewLabel !== null && previewLabel !== undefined && previewLabel !== "" ? (
          <p className="min-w-0 flex-1 truncate px-1 text-xs font-medium text-primary tabular-nums">
            {previewLabel}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg text-lg font-semibold text-stone-700 transition hover:bg-stone-100 active:bg-stone-200"
            aria-label={t("amountToolbarAdd")}
            onPointerDown={preventInputBlur}
            onClick={onAdd}
          >
            +
          </button>
          <button
            type="button"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg text-lg font-semibold text-stone-700 transition hover:bg-stone-100 active:bg-stone-200"
            aria-label={t("amountToolbarSubtract")}
            onPointerDown={preventInputBlur}
            onClick={onSubtract}
          >
            −
          </button>
          <button
            type="button"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg text-lg font-semibold text-stone-700 transition hover:bg-stone-100 active:bg-stone-200"
            aria-label={t("amountToolbarSplit")}
            onPointerDown={preventInputBlur}
            onClick={onSplit}
          >
            ÷
          </button>
          <button
            type="button"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-hover active:scale-[0.98]"
            aria-label={t("amountToolbarConfirm")}
            onPointerDown={preventInputBlur}
            onClick={onConfirm}
          >
            <Check className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
