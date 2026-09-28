import { afterEach, describe, expect, it } from "vitest";
import { NotFoundError, UnauthorizedError } from "../errors/app.errors.js";
import { assertAdminToken } from "./admin-access.js";

const TOKEN = "a".repeat(40);

describe("assertAdminToken", () => {
  afterEach(() => {
    delete process.env.ADMIN_STATS_TOKEN;
  });

  it("hides the endpoint when no token is configured", () => {
    expect(() => assertAdminToken(`Bearer ${TOKEN}`)).toThrow(NotFoundError);
  });

  it("hides the endpoint when the configured token is too short", () => {
    process.env.ADMIN_STATS_TOKEN = "short";
    expect(() => assertAdminToken("Bearer short")).toThrow(NotFoundError);
  });

  it("rejects a missing or wrong token", () => {
    process.env.ADMIN_STATS_TOKEN = TOKEN;
    expect(() => assertAdminToken(undefined)).toThrow(UnauthorizedError);
    expect(() => assertAdminToken(`Bearer ${"b".repeat(40)}`)).toThrow(UnauthorizedError);
  });

  it("accepts the configured token", () => {
    process.env.ADMIN_STATS_TOKEN = TOKEN;
    expect(() => assertAdminToken(`Bearer ${TOKEN}`)).not.toThrow();
  });
});
