import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useDeploymentMode } from "../../contexts/DeploymentModeContext.tsx";
import { getToken } from "../../lib/auth-storage.ts";
import { getPrivacyContactEmail } from "../../lib/privacy-contact.ts";
import { btnPrimary, btnSecondary } from "../../lib/ui-classes.ts";
import { AppLogo } from "../brand/AppLogo.tsx";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.tsx";

const footerLinkClass = "text-sm text-stone-600 transition hover:text-primary";

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
  const { t: tCommon } = useTranslation("common");
  const { isLocalMode, isLoading } = useDeploymentMode();
  const hasSession = Boolean(getToken());
  const showAuth = !isLoading && !isLocalMode;
  const contactEmail = getPrivacyContactEmail();

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <nav aria-label={t("footerProduct")}>
          <h2 className="text-sm font-semibold text-stone-900">{t("footerProduct")}</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to="/#how" className={footerLinkClass}>
                {t("footerHow")}
              </Link>
            </li>
            <li>
              <Link to="/#features" className={footerLinkClass}>
                {t("footerFeatures")}
              </Link>
            </li>
            {showAuth && !hasSession && (
              <>
                <li>
                  <Link to="/register" className={footerLinkClass}>
                    {t("createHousehold")}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className={footerLinkClass}>
                    {t("signIn")}
                  </Link>
                </li>
              </>
            )}
            {showAuth && hasSession && (
              <li>
                <Link to="/households" className={footerLinkClass}>
                  {tCommon("goToHouseholds")}
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <nav aria-label={t("footerHelp")}>
          <h2 className="text-sm font-semibold text-stone-900">{t("footerHelp")}</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <a href={`mailto:${contactEmail}`} className={footerLinkClass}>
                {t("footerContact")}
              </a>
            </li>
            <li>
              <Link to="/help" className={footerLinkClass}>
                {t("footerFaq")}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={t("footerLegal")}>
          <h2 className="text-sm font-semibold text-stone-900">{t("footerLegal")}</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to="/privacy" className={footerLinkClass}>
                {t("privacyLink")}
              </Link>
            </li>
            <li>
              <Link to="/privacy#cookies" className={footerLinkClass}>
                {t("footerCookies")}
              </Link>
            </li>
            <li>
              <Link to="/legal" className={footerLinkClass}>
                {t("footerLegalNotice")}
              </Link>
            </li>
            <li>
              <Link to="/terms" className={footerLinkClass}>
                {t("footerTerms")}
              </Link>
            </li>
            <li>
              <Link to="/accessibility" className={footerLinkClass}>
                {t("footerAccessibility")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-5xl px-4 py-4 text-sm text-stone-500 sm:px-6">{t("footerNote")}</p>
      </div>
    </footer>
  );
}

export function PublicDocument({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">{title}</h1>
        {updated ? <p className="mt-2 text-sm text-stone-500">{updated}</p> : null}
        {intro ? <p className="mt-6 whitespace-pre-line text-base text-stone-700">{intro}</p> : null}
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
