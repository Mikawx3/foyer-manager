import { createHash, timingSafeEqual } from "node:crypto";
import { NotFoundError, UnauthorizedError } from "../errors/app.errors.js";

const MIN_TOKEN_LENGTH = 32;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * Admin endpoints stay hidden (404) unless ADMIN_STATS_TOKEN is configured,
 * so self-hosted instances expose nothing by default.
 */
export function assertAdminToken(authorizationHeader: string | undefined): void {
  const expected = process.env.ADMIN_STATS_TOKEN?.trim() ?? "";
  if (expected.length < MIN_TOKEN_LENGTH) {
    throw new NotFoundError("Not found");
  }

  const provided = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : "";
  if (!timingSafeEqual(digest(provided), digest(expected))) {
    throw new UnauthorizedError("Invalid admin token");
  }
}
