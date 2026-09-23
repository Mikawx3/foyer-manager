import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../app.js";
import { loadUserAccess } from "../lib/user-access.js";

vi.mock("../lib/jwt.js", () => ({
  verifyToken: vi.fn(async () => ({
    userId: "user-1",
  })),
  signToken: vi.fn(async () => "token"),
}));

vi.mock("../lib/user-access.js", () => ({
  loadUserAccess: vi.fn(async () => ({
    userId: "user-1",
    isGuest: false,
    memberships: [{ householdId: "clh12345678901234567890123", role: "admin" }],
  })),
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
    vi.mocked(loadUserAccess).mockResolvedValue({
      userId: "user-1",
      isGuest: false,
      memberships: [{ householdId: "clh12345678901234567890123", role: "admin" }],
    });
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

  it("rejects member management from a non-admin in cloud mode", async () => {
    process.env.DEPLOYMENT_MODE = "cloud";
    const householdId = "clh12345678901234567890123";
    const tenantId = "clh22345678901234567890123";

    vi.mocked(loadUserAccess).mockResolvedValue({
      userId: "user-1",
      isGuest: true,
      memberships: [{ householdId, role: "guest" }],
    });

    const removeResponse = await app.request(`/api/households/${householdId}/tenants/${tenantId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    expect(removeResponse.status).toBe(403);

    const updateResponse = await app.request(`/api/households/${householdId}/tenants/${tenantId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ name: "Marie" }),
    });
    expect(updateResponse.status).toBe(403);

    const createResponse = await app.request("/api/tenants", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ name: "Marie", householdId }),
    });
    expect(createResponse.status).toBe(403);

    const previewResponse = await app.request(
      `/api/households/${householdId}/tenants/${tenantId}/removal-preview`,
      { headers: authHeaders },
    );
    expect(previewResponse.status).toBe(403);
  });

  it("GET /api/config returns deployment mode", async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    const response = await app.request("/api/config");
    expect(response.status).toBe(200);
    const body = (await response.json()) as { deploymentMode: string; googleClientId: string | null };
    expect(body).toEqual({ deploymentMode: "local", googleClientId: null });
  });
});
