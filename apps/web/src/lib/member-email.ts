const PLACEHOLDER_DOMAIN = "members.foyer.local";

export function isPlaceholderMemberEmail(email: string): boolean {
  return email.endsWith(`@${PLACEHOLDER_DOMAIN}`);
}

export function formatMemberEmail(email: string): string | null {
  return isPlaceholderMemberEmail(email) ? null : email;
}
