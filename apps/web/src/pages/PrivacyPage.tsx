import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PublicFooter, PublicHeader } from "../components/layout/PublicChrome.tsx";
import { getPrivacyContactEmail } from "../lib/privacy-contact.ts";

const SECTIONS = [
  "controller",
  "data",
  "purposes",
  "recipients",
  "transfers",
  "retention",
  "rights",
  "cookies",
  "security",
  "children",
  "changes",
  "notice",
] as const;

export function PrivacyPage() {
  const { t } = useTranslation("privacy");
  const contactEmail = getPrivacyContactEmail();

  useEffect(() => {
    document.title = t("metaTitle");
  }, [t]);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-stone-500">{t("updated")}</p>
        <p className="mt-6 text-base text-stone-700">{t("intro")}</p>
        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section}>
              <h2 className="text-lg font-semibold tracking-tight text-stone-900">
                {t(`${section}Title`)}
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700">
                {section === "controller"
                  ? contactEmail
                    ? t("controllerBody", { email: contactEmail })
                    : t("controllerBodyNoEmail")
                  : t(`${section}Body`)}
              </p>
              {section === "controller" && contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary-hover"
                >
                  {contactEmail}
                </a>
              )}
              {section === "rights" && (
                <a
                  href="https://www.cnil.fr"
                  className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary-hover"
                >
                  {t("cnilLink")}
                </a>
              )}
            </section>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
