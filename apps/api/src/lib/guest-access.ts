export const GUEST_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function isGuestExpired(createdAt: Date, now = Date.now()): boolean {
  return createdAt.getTime() + GUEST_TTL_MS <= now;
}
