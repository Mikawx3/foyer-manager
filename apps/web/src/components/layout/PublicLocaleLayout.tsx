import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect.ts";
import { readStoredLocale } from "../../lib/locale-preference.ts";
import { localizePath, normalizeLocale, parsePublicPath, type PublicLocale } from "../../lib/public-routes.ts";

interface PublicLocaleLayoutProps {
  locale: PublicLocale;
}

/**
 * Public pages take their language from the URL (`/` is French, `/en` is English).
 * A visitor who picked a language explicitly is sent to that version once.
 */
export function PublicLocaleLayout({ locale }: PublicLocaleLayoutProps) {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useIsomorphicLayoutEffect(() => {
    if (normalizeLocale(i18n.language) !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [i18n, locale]);

  useEffect(() => {
    const stored = readStoredLocale();
    const parsed = parsePublicPath(location.pathname);
    if (!stored || stored === locale || !parsed) {
      return;
    }
    navigate(`${localizePath(parsed.path, stored)}${location.search}${location.hash}`, { replace: true });
    // Runs once per mounted locale layout: switching language remounts it.
  }, [locale]);

  return <Outlet />;
}
