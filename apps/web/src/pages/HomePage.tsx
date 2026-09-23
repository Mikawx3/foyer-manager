import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/layout/PublicChrome.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { useDeploymentMode } from "../contexts/DeploymentModeContext.tsx";
import { getToken } from "../lib/auth-storage.ts";
import { resolvePublicHome } from "../lib/public-entry.ts";
import { amountLg, btnPrimary, btnSecondary, card } from "../lib/ui-classes.ts";

const STEPS = ["step1", "step2", "step3"] as const;
const FEATURES = ["splits", "recurring", "balances", "month"] as const;

export function HomePage() {
  const { t } = useTranslation("landing");
  const { isLocalMode, isLoading } = useDeploymentMode();
  const hasSession = Boolean(getToken());

  useEffect(() => {
    document.title = t("metaTitle");
  }, [t]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <ListSkeleton rows={3} />
      </div>
    );
  }

  if (resolvePublicHome(isLocalMode, hasSession) === "app") {
    return <Navigate to="/households" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PublicHeader />
      <main>
        <section className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:py-20">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-4 max-w-xl text-base text-stone-600">{t("heroSubtitle")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className={`${btnPrimary} px-5`}>
                {t("createHousehold")}
              </Link>
              <Link
                to="/login"
                className={`${btnSecondary} rounded-lg border border-stone-200 bg-surface px-5`}
              >
                {t("signIn")}
              </Link>
            </div>
          </div>
          <div className={`${card} mx-auto w-full max-w-sm`}>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
              {t("exampleLabel")}
            </p>
            <p className="mt-4 text-sm text-stone-600">{t("exampleLine")}</p>
            <p className={`${amountLg} mt-1 text-3xl`}>{t("exampleAmount")}</p>
            <p className="mt-3 text-sm text-stone-500">{t("exampleNote")}</p>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-t border-border bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-semibold tracking-tight text-stone-900">{t("howTitle")}</h2>
            <ol className="mt-6 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step}>
                  <p className="text-sm font-medium text-primary">{index + 1}</p>
                  <h3 className="mt-2 font-semibold text-stone-900">{t(`${step}Title`)}</h3>
                  <p className="mt-1 text-sm text-stone-600">{t(`${step}Body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6">
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">{t("featuresTitle")}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature} className={card}>
                <h3 className="font-semibold text-stone-900">{t(`${feature}Title`)}</h3>
                <p className="mt-1 text-sm text-stone-600">{t(`${feature}Body`)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-semibold tracking-tight text-stone-900">{t("trustTitle")}</h2>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li>{t("trustAccount")}</li>
              <li>{t("trustPrivate")}</li>
              <li>{t("trustNoAds")}</li>
            </ul>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
