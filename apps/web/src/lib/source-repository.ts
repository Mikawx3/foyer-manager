export const DEFAULT_SOURCE_REPOSITORY_URL = "https://github.com/Mikawx3/foyer-manager";

/** AGPL-3.0 §13: a modified deployment must link to its own source, so the URL is configurable. */
export function resolveSourceRepositoryUrl(configured: string | undefined): string {
  const trimmed = configured?.trim() ?? "";
  return /^https?:\/\//.test(trimmed) ? trimmed : DEFAULT_SOURCE_REPOSITORY_URL;
}

export function getSourceRepositoryUrl(): string {
  return resolveSourceRepositoryUrl(import.meta.env.VITE_SOURCE_URL);
}
