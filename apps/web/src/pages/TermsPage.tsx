import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PublicDocument } from "../components/layout/PublicChrome.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { getPrivacyContactEmail } from "../lib/privacy-contact.ts";

const SECTIONS = [
  "service",
  "account",
  "household",
  "data",
  "deletion",
  "use",
  "availability",
  "age",
  "changes",
  "law",
] as const;

const linkClass = "mt-2 inline-block text-sm font-medium text-primary hover:text-primary-hover";

export function TermsPage() {
  const { t } = useTranslation("terms");
  const contactEmail = getPrivacyContactEmail();

  usePageMeta(t("metaTitle"), t("metaDescription"));

  return (
    <PublicDocument
      title={t("title")}
      updated={t("updated")}
      intro={t("intro", { email: contactEmail })}
    >
      <a href={`mailto:${contactEmail}`} className={linkClass}>
        {contactEmail}
      </a>
      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section}>
            <h2 className="text-lg font-semibold tracking-tight text-stone-900">
              {t(`${section}Title`)}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700">
              {t(`${section}Body`)}
            </p>
            {section === "data" && (
              <Link to="/privacy" className={linkClass}>
                {t("privacyLink")}
              </Link>
            )}
            {section === "deletion" && (
              <a href={`mailto:${contactEmail}`} className={linkClass}>
                {contactEmail}
              </a>
            )}
          </section>
        ))}
      </div>
    </PublicDocument>
  );
}
