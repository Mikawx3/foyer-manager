import { describe, expect, it } from "vitest";
import { GUEST_TTL_MS, isGuestExpired, shouldRefreshGuestSeen } from "./guest-access.js";

const now = Date.parse("2026-09-23T12:00:00.000Z");

describe("guest access lifetime", () => {
  it("keeps a visit that was opened within the last 30 days", () => {
    const lastSeenAt = new Date(now - 29 * 24 * 60 * 60 * 1000);
    expect(isGuestExpired(lastSeenAt, now)).toBe(false);
  });

  it("expires a visit with no opening for 30 days", () => {
    const lastSeenAt = new Date(now - GUEST_TTL_MS);
    expect(isGuestExpired(lastSeenAt, now)).toBe(true);
  });

  it("refreshes the visit at most once a day", () => {
    expect(shouldRefreshGuestSeen(new Date(now - 60 * 60 * 1000), now)).toBe(false);
    expect(shouldRefreshGuestSeen(new Date(now - 25 * 60 * 60 * 1000), now)).toBe(true);
  });
});
