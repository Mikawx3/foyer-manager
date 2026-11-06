import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PublicFooter, PublicHeader } from "../components/layout/PublicChrome.tsx";
import { useDeploymentMode } from "../contexts/DeploymentModeContext.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { useLocalizePath } from "../hooks/usePublicLocale.ts";
import { showPublicAuthLinks } from "../lib/public-entry.ts";
import { getSourceRepositoryUrl } from "../lib/source-repository.ts";
import { btnPrimary, card } from "../lib/ui-classes.ts";

const COLUMNS = ["allotwe", "tricount", "splitwise", "spreadsheet"] as const;

const ROWS = ["openSource", "selfHost", "noAccount", "income", "recurring", "nativeApps", "currencies"] as const;

const SECTIONS = ["whenAllotwe", "whenOthers", "honest"] as const;

type Column = (typeof COLUMNS)[number];
type Row = (typeof ROWS)[number];

/**
 * One cell per product and criterion. `yes` / `no` render a word; any other
 * key is a short phrase from the `compare` namespace (`cell.<row>.<column>`).
 */
const CELLS: Record<Row, Record<Column, "yes" | "no" | "text">> = {
  openSource: { allotwe: "yes", tricount: "no", splitwise: "no", spreadsheet: "text" },
  selfHost: { allotwe: "yes", tricount: "no", splitwise: "no", spreadsheet: "text" },
  noAccount: { allotwe: "yes", tricount: "yes", splitwise: "no", spreadsheet: "yes" },
  income: { allotwe: "yes", tricount: "no", splitwise: "no", spreadsheet: "text" },
  recurring: { allotwe: "yes", tricount: "text", splitwise: "yes", spreadsheet: "text" },
  nativeApps: { allotwe: "text", tricount: "yes", splitwise: "yes", spreadsheet: "text" },
  currencies: { allotwe: "text", tricount: "yes", splitwise: "yes", spreadsheet: "text" },
};

export function ComparePage() {
  const { t } = useTranslation("compare");
  const { t: tLanding } = useTranslation("landing");
  const { isLocalMode, isLoading, isConfigError } = useDeploymentMode();
  const localize = useLocalizePath();
  const showAuth = showPublicAuthLinks(isLoading, isConfigError, isLocalMode);

  usePageMeta(t("metaTitle"), t("metaDescription"));

  const cellLabel = (row: Row, column: Column): string => {
    const kind = CELLS[row][column];
    return kind === "text" ? t(`cell.${row}.${column}`) : t(kind);
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PublicHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-base text-stone-600">{t("intro")}</p>

        <div className="mt-10 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <caption className="sr-only">{t("tableCaption")}</caption>
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="px-4 py-3 font-medium text-stone-500">
                  {t("criterion")}
                </th>
                {COLUMNS.map((column) => (
                  <th key={column} scope="col" className="px-4 py-3 font-semibold text-stone-900">
                    {t(`column.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row} className="border-b border-border last:border-b-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-stone-700">
                    {t(`row.${row}`)}
                  </th>
                  {COLUMNS.map((column) => {
                    const kind = CELLS[row][column];
                    const tone =
                      kind === "yes" ? "text-positive" : kind === "no" ? "text-stone-400" : "text-stone-700";
                    return (
                      <td key={column} className={`px-4 py-3 ${tone}`}>
                        {cellLabel(row, column)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-stone-500">{t("tableNote")}</p>

        <div className="mt-12 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section}>
              <h2 className="text-lg font-semibold tracking-tight text-stone-900">{t(`${section}Title`)}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700">{t(`${section}Body`)}</p>
            </section>
          ))}
        </div>

        <div className={`${card} mt-12`}>
          <h2 className="font-semibold text-stone-900">{t("tryTitle")}</h2>
          <p className="mt-1 text-sm text-stone-600">{t("tryBody")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {showAuth && (
              <Link to="/households/new" className={`${btnPrimary} px-5`}>
                {tLanding("createHousehold")}
              </Link>
            )}
            <a
              href={getSourceRepositoryUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              {tLanding("advantageOpenLink")}
            </a>
          </div>
        </div>

        <ul className="mt-10 flex flex-wrap gap-2 text-sm">
          <li>
            <Link to={localize("/use/couple")} className="text-primary hover:text-primary-hover">
              {tLanding("useCoupleTitle")}
            </Link>
          </li>
          <li aria-hidden className="text-stone-300">
            ·
          </li>
          <li>
            <Link to={localize("/use/roommates")} className="text-primary hover:text-primary-hover">
              {tLanding("useRoommatesTitle")}
            </Link>
          </li>
          <li aria-hidden className="text-stone-300">
            ·
          </li>
          <li>
            <Link to={localize("/use/bills")} className="text-primary hover:text-primary-hover">
              {tLanding("useBillsTitle")}
            </Link>
          </li>
        </ul>
      </main>
      <PublicFooter />
    </div>
  );
}
