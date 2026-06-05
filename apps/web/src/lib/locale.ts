export function toIntlLocale(language: string): string {
  return language.startsWith("fr") ? "fr-FR" : "en-US";
}
