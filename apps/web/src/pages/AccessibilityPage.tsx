import { useTranslation } from "react-i18next";
import { PublicDocument } from "../components/layout/PublicChrome.tsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.ts";
import { getPrivacyContactEmail } from "../lib/privacy-contact.ts";

const SECTIONS = ["effort", "contact"] as const;

const linkClass = "mt-2 inline-block text-sm font-medium text-primary hover:text-primary-hover";

export function AccessibilityPage() {
  const { t } = useTranslation("accessibility");
  const contactEmail = getPrivacyContactEmail();

  useDocumentTitle(t("metaTitle"));

  return (
    <PublicDocument title={t("title")} updated={t("updated")} intro={t("intro")}>
      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section}>
            <h2 className="text-lg font-semibold tracking-tight text-stone-900">
              {t(`${section}Title`)}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700">
              {section === "contact" ? t("contactBody", { email: contactEmail }) : t(`${section}Body`)}
            </p>
            {section === "contact" && (
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
