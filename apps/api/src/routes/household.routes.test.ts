import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";

vi.mock("../lib/jwt.js", () => ({
  verifyToken: vi.fn(async () => ({
    userId: "user-1",
    householdId: "clh12345678901234567890123",
  })),
  signToken: vi.fn(async () => "token"),
}));

vi.mock("../repositories/household.repository.js", () => ({
  householdRepository: {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    create: vi.fn(),
    createWithSoloTenant: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
  },
}));

describe("household routes", () => {
  afterEach(() => {
    delete process.env.DEPLOYMENT_MODE;
  });

  const authHeaders = {
    Authorization: "Bearer test-token",
    "Content-Type": "application/json",
  };

  it("POST /api/households returns 400 for invalid body", async () => {
    const response = await app.request("/api/households", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "" }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  it("GET /api/households/:id returns 400 for invalid id", async () => {
    const response = await app.request("/api/households/not-a-cuid", {
      headers: authHeaders,
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  it("GET /api/households returns 401 without token in cloud mode", async () => {
    process.env.DEPLOYMENT_MODE = "cloud";
    const response = await app.request("/api/households");
    expect(response.status).toBe(401);
  });

  it("GET /api/households allows access without token in local mode", async () => {
    process.env.DEPLOYMENT_MODE = "local";
    const response = await app.request("/api/households");
    expect(response.status).toBe(200);
  });

  it("GET /api/config returns deployment mode", async () => {
    const response = await app.request("/api/config");
    expect(response.status).toBe(200);
    const body = (await response.json()) as { deploymentMode: string };
    expect(body.deploymentMode).toBe("local");
  });
});
