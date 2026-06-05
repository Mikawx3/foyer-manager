import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AppLogo } from "../brand/AppLogo.tsx";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";

interface AppHeaderProps {
  trailing?: ReactNode;
}

export function AppHeader({ trailing }: AppHeaderProps) {
  const { t } = useTranslation("common");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/households"
          className="flex items-center gap-3 rounded-lg transition hover:opacity-90"
        >
          <AppLogo />
          <span className="text-lg font-semibold tracking-tight text-stone-900">
            {t("appName")}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          {trailing}
        </div>
      </div>
    </header>
  );
}
