export const DEFAULT_APP_NAME = "Foyer Manager";

export function resolveAppName(configured: string | undefined): string {
  if (typeof configured !== "string") {
    return DEFAULT_APP_NAME;
  }
  const trimmed = configured.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_APP_NAME;
}

export function getAppName(): string {
  return resolveAppName(import.meta.env.VITE_APP_NAME);
}
