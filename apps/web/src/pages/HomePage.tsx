import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/layout/PublicChrome.tsx";
import { ListSkeleton } from "../components/ui/Skeleton.tsx";
import { useDeploymentMode } from "../contexts/DeploymentModeContext.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { getToken } from "../lib/auth-storage.ts";
import { resolvePublicHome } from "../lib/public-entry.ts";
import { amount, amountLg, btnPrimary, btnSecondary, card, cardInteractive } from "../lib/ui-classes.ts";

const AUDIENCES = [
  { to: "/use/couple", label: "audienceCouple" },
  { to: "/use/roommates", label: "audienceRoommates" },
  { to: "/use/solo", label: "audienceSolo" },
] as const;

const PREVIEW_LINES = ["Groceries", "Electricity", "Internet"] as const;

const STEPS = ["step1", "step2", "step3"] as const;

const ADVANTAGES = ["Balance", "Bills", "Private"] as const;

const USE_CASES = [
  { to: "/use/couple", title: "useCoupleTitle", body: "useCoupleBody" },
  { to: "/use/roommates", title: "useRoommatesTitle", body: "useRoommatesBody" },
  { to: "/use/solo", title: "useSoloTitle", body: "useSoloBody" },
  { to: "/use/bills", title: "useBillsTitle", body: "useBillsBody" },
] as const;

const audienceLinkClass =
  "inline-flex min-h-11 items-center rounded-full border border-stone-200 bg-surface px-3 text-sm font-medium text-stone-700 transition hover:border-primary/30 hover:text-primary";

export function HomePage() {
  const { t } = useTranslation("landing");
  const { isLocalMode, isLoading } = useDeploymentMode();
  const hasSession = Boolean(getToken());

  usePageMeta(t("metaTitle"), t("metaDescription"));

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
            <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
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
            <ul className="mt-6 flex flex-wrap gap-2">
              {AUDIENCES.map((audience) => (
                <li key={audience.to}>
                  <Link to={audience.to} className={audienceLinkClass}>
                    {t(audience.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={`${card} mx-auto w-full max-w-sm`}>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
              {t("exampleLabel")}
            </p>
            <ul className="mt-2 divide-y divide-stone-100">
              {PREVIEW_LINES.map((line) => (
                <li key={line} className="flex items-baseline justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{t(`preview${line}Title`)}</p>
                    <p className="text-xs text-stone-500">{t(`preview${line}By`)}</p>
                  </div>
                  <p className={`${amount} text-sm`}>{t(`preview${line}Amount`)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-1 border-t border-stone-200 pt-3">
              <p className="text-sm text-stone-600">{t("exampleLine")}</p>
              <p className={`${amountLg} mt-1 text-3xl`}>{t("exampleAmount")}</p>
              <p className="mt-2 text-xs text-stone-500">{t("exampleNote")}</p>
            </div>
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

        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">{t("advantagesTitle")}</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {ADVANTAGES.map((advantage) => (
              <li key={advantage} className={card}>
                <h3 className="font-semibold text-stone-900">{t(`advantage${advantage}Title`)}</h3>
                <p className="mt-1 text-sm text-stone-600">{t(`advantage${advantage}Body`)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="who" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-semibold tracking-tight text-stone-900">{t("useCasesTitle")}</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {USE_CASES.map((useCase) => (
                <li key={useCase.to}>
                  <Link to={useCase.to} className={cardInteractive}>
                    <h3 className="font-semibold text-stone-900">{t(useCase.title)}</h3>
                    <p className="mt-1 text-sm text-stone-600">{t(useCase.body)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <h2 className="text-lg font-semibold tracking-tight text-stone-900">{t("closingTitle")}</h2>
            <p className="mt-2 max-w-xl text-sm text-stone-600">{t("closingBody")}</p>
            <Link to="/register" className={`${btnPrimary} mt-6 px-5`}>
              {t("createHousehold")}
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
