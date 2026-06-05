import { Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { btnPrimary } from "../lib/ui-classes.ts";

export function NotFoundPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <Home className="mb-4 h-10 w-10 text-stone-400" strokeWidth={1.5} aria-hidden />
      <p className="text-6xl font-bold text-stone-200">{t("notFoundCode")}</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-900">{t("pageNotFound")}</h1>
      <p className="mt-2 max-w-md text-sm text-stone-600">
        {t("pageNotFoundDescription")}
      </p>
      <button
        type="button"
        className={`${btnPrimary} mt-8`}
        onClick={() => navigate("/")}
      >
        {t("goToHouseholds")}
      </button>
    </div>
  );
}
