import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useDeploymentMode } from "../../contexts/DeploymentModeContext.tsx";
import { getToken } from "../../lib/auth-storage.ts";
import { btnPrimary, btnSecondary } from "../../lib/ui-classes.ts";
import { AppLogo } from "../brand/AppLogo.tsx";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";

export function PublicHeader() {
  const { t } = useTranslation("common");
  const { t: tLanding } = useTranslation("landing");
  const { isLocalMode, isLoading } = useDeploymentMode();
  const hasSession = Boolean(getToken());
  const showAuth = !isLoading && !isLocalMode;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3 rounded-lg transition hover:opacity-90">
          <AppLogo />
          <span className="text-lg font-semibold tracking-tight text-stone-900">{t("appName")}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher compact />
          {showAuth && hasSession && (
            <Link to="/households" className={`${btnSecondary} px-2`}>
              {t("goToHouseholds")}
            </Link>
          )}
          {showAuth && !hasSession && (
            <>
              <Link to="/login" className={`${btnSecondary} px-2`}>
                {tLanding("signIn")}
              </Link>
              <Link to="/register" className={`${btnPrimary} hidden sm:inline-flex`}>
                {tLanding("createHousehold")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const { t } = useTranslation("landing");

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>{t("footerNote")}</p>
        <Link to="/privacy" className="font-medium text-primary hover:text-primary-hover">
          {t("privacyLink")}
        </Link>
      </div>
    </footer>
  );
}
