import { useTranslation } from "react-i18next";
import { btnPrimary } from "../../lib/ui-classes.ts";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const { t } = useTranslation("common");

  return (
    <div
      className="rounded-lg border border-negative/20 bg-negative/5 px-4 py-3 text-sm text-negative"
      role="alert"
    >
      <p className="font-medium">{t("error")}</p>
      <p className="mt-1 text-stone-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`mt-3 ${btnPrimary}`}>
          {t("tryAgain")}
        </button>
      )}
    </div>
  );
}
