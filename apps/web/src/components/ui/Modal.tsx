import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSwipeToClose } from "../../hooks/useSwipeToClose.ts";
import { bottomSheetPanel, iconBtn } from "../../lib/ui-classes.ts";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** When true, sheet fills most of the viewport on mobile (e.g. expense form). */
  fullHeightMobile?: boolean;
}

export function Modal({ title, open, onClose, children, fullHeightMobile = false }: ModalProps) {
  const { t } = useTranslation("common");
  const { panelStyle, swipeHandlers } = useSwipeToClose(onClose, open);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        aria-label={t("closeDialog")}
        onClick={onClose}
      />
      <div
        className={`${bottomSheetPanel} ${
          fullHeightMobile ? "h-[calc(100dvh-env(safe-area-inset-top,0px)-1rem)] md:h-auto" : ""
        } transition-transform duration-300 ease-out`}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div
          className="shrink-0 cursor-grab touch-none active:cursor-grabbing md:hidden"
          {...swipeHandlers}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-300" aria-hidden />
        </div>
        <div
          className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3"
          {...swipeHandlers}
        >
          <h2 id="modal-title" className="text-base font-semibold tracking-tight text-stone-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} className={iconBtn} aria-label={t("close")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
