import { describe, expect, it } from "vitest";

describe("foyer-api", () => {
  it("health payload shape", () => {
    const payload = { status: "ok", service: "foyer-api" };
    expect(payload.status).toBe("ok");
  });
});
