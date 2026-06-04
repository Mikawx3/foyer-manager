import { describe, expect, it } from "vitest";
import type { Tenant } from "./index.js";

describe("@foyer/types", () => {
  it("exports Tenant shape", () => {
    const tenant: Tenant = {
      id: "1",
      name: "Alice",
      email: "alice@example.com",
      householdId: "h1",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(tenant.name).toBe("Alice");
  });
});
