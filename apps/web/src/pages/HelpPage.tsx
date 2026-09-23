import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PublicDocument } from "../components/layout/PublicChrome.tsx";
import { useDocumentTitle } from "../hooks/useDocumentTitle.ts";
import { getPrivacyContactEmail } from "../lib/privacy-contact.ts";

const QUESTIONS = ["who", "invite", "delete", "google", "ads"] as const;

const linkClass = "mt-2 inline-block text-sm font-medium text-primary hover:text-primary-hover";

export function HelpPage() {
  const { t } = useTranslation("help");
  const contactEmail = getPrivacyContactEmail();

  useDocumentTitle(t("metaTitle"));

  return (
    <PublicDocument title={t("title")} intro={t("intro")}>
      <Link to="/privacy" className={linkClass}>
        {t("privacyLink")}
      </Link>
      <div className="mt-10 space-y-8">
        {QUESTIONS.map((question) => (
          <section key={question}>
            <h2 className="text-lg font-semibold tracking-tight text-stone-900">
              {t(`${question}Title`)}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700">
              {question === "delete" ? t("deleteBody", { email: contactEmail }) : t(`${question}Body`)}
            </p>
            {question === "delete" && (
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
