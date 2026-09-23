export const DEFAULT_PRIVACY_CONTACT_EMAIL = "foyer-manager@gmail.com";

export function normalizePrivacyContactEmail(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolvePrivacyContactEmail(configured: string | undefined): string {
  return normalizePrivacyContactEmail(configured) ?? DEFAULT_PRIVACY_CONTACT_EMAIL;
}

export function getPrivacyContactEmail(): string {
  return resolvePrivacyContactEmail(import.meta.env.VITE_PRIVACY_CONTACT_EMAIL);
}
