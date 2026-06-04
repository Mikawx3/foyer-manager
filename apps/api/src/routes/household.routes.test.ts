import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("household routes", () => {
  it("POST /api/households returns 400 for invalid body", async () => {
    const response = await app.request("/api/households", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  it("GET /api/households/:id returns 400 for invalid id", async () => {
    const response = await app.request("/api/households/not-a-cuid");

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });
});
