import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PublicDocument } from "../components/layout/PublicChrome.tsx";
import { getPrivacyContactEmail } from "../lib/privacy-contact.ts";

const SECTIONS = ["publisher", "hosting", "privacy"] as const;

const linkClass = "mt-2 inline-block text-sm font-medium text-primary hover:text-primary-hover";

export function LegalNoticePage() {
  const { t } = useTranslation("legal");
  const contactEmail = getPrivacyContactEmail();

  useEffect(() => {
    document.title = t("metaTitle");
  }, [t]);

  return (
    <PublicDocument title={t("title")} updated={t("updated")} intro={t("intro")}>
      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section}>
            <h2 className="text-lg font-semibold tracking-tight text-stone-900">
              {t(`${section}Title`)}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700">
              {section === "publisher" ? t("publisherBody", { email: contactEmail }) : t(`${section}Body`)}
            </p>
            {section === "publisher" && (
              <a href={`mailto:${contactEmail}`} className={linkClass}>
                {contactEmail}
              </a>
            )}
            {section === "privacy" && (
              <Link to="/privacy" className={linkClass}>
                {t("privacyLink")}
              </Link>
            )}
          </section>
        ))}
      </div>
    </PublicDocument>
  );
}
