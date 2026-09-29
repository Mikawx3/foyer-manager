import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/layout/PublicChrome.tsx";
import { useDeploymentMode } from "../contexts/DeploymentModeContext.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { getAppName } from "../lib/app-name.ts";
import { btnPrimary, card } from "../lib/ui-classes.ts";

const USE_CASE_IDS = ["couple", "roommates", "solo", "bills"] as const;
const POINTS = ["point1", "point2", "point3"] as const;

type UseCaseId = (typeof USE_CASE_IDS)[number];

function isUseCaseId(value: string | undefined): value is UseCaseId {
  return USE_CASE_IDS.some((id) => id === value);
}

export function UseCasePage() {
  const { useCaseId } = useParams();
  const { t } = useTranslation("useCases");
  const { t: tLanding } = useTranslation("landing");
  const { isLocalMode, isLoading } = useDeploymentMode();
  const showAuth = !isLoading && !isLocalMode;
  const valid = isUseCaseId(useCaseId);

  usePageMeta(
    valid ? t(`${useCaseId}.metaTitle`) : getAppName(),
    valid ? t(`${useCaseId}.metaDescription`) : undefined,
  );

  useLayoutEffect(() => {
    if (!valid) {
      return;
    }
    window.scrollTo(0, 0);
  }, [useCaseId, valid]);

  if (!valid) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
          {t(`${useCaseId}.title`)}
        </h1>
        <p className="mt-4 max-w-xl text-base text-stone-600">{t(`${useCaseId}.intro`)}</p>
        <ul className="mt-8 grid gap-4">
          {POINTS.map((point) => (
            <li key={point} className={card}>
              <h2 className="font-semibold text-stone-900">{t(`${useCaseId}.${point}Title`)}</h2>
              <p className="mt-1 text-sm text-stone-600">{t(`${useCaseId}.${point}Body`)}</p>
            </li>
          ))}
        </ul>
        {showAuth && (
          <div className="mt-10">
            <Link to="/households/new" className={`${btnPrimary} px-5`}>
              {tLanding("createHousehold")}
            </Link>
            <p className="mt-3 text-sm text-stone-500">{tLanding("noAccountHint")}</p>
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
