export const GUEST_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Sliding session for a guest visit. Real accounts keep JWT_EXPIRES_IN. */
export const GUEST_TOKEN_EXPIRES_IN = "30d";

const GUEST_SEEN_REFRESH_MS = 24 * 60 * 60 * 1000;

export function isGuestExpired(lastSeenAt: Date, now = Date.now()): boolean {
  return lastSeenAt.getTime() + GUEST_TTL_MS <= now;
}

export function shouldRefreshGuestSeen(lastSeenAt: Date, now = Date.now()): boolean {
  return now - lastSeenAt.getTime() >= GUEST_SEEN_REFRESH_MS;
}
