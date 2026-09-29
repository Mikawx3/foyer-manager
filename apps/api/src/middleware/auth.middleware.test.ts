import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { errorHandler } from "../middleware/error-handler.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UnauthorizedError } from "../errors/app.errors.js";

vi.mock("../lib/jwt.js", () => ({
  verifyToken: vi.fn(),
  signToken: vi.fn(async () => "refreshed-token"),
}));

import { verifyToken, signToken } from "../lib/jwt.js";
import { loadUserAccess } from "../lib/user-access.js";

vi.mock("../lib/user-access.js", () => ({
  loadUserAccess: vi.fn(),
}));

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.DEPLOYMENT_MODE;
  });

  afterEach(() => {
    delete process.env.DEPLOYMENT_MODE;
  });

  it("bypasses auth in local deployment mode", async () => {
    process.env.DEPLOYMENT_MODE = "local";

    const app = new Hono();
    app.onError(errorHandler);
    app.use("*", authMiddleware);
    app.get("/protected", (c) => c.json({ ok: true }));

    const response = await app.request("/protected");
    expect(response.status).toBe(200);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is missing in cloud mode", async () => {
    process.env.DEPLOYMENT_MODE = "cloud";

    const app = new Hono();
    app.onError(errorHandler);
    app.use("*", authMiddleware);
    app.get("/protected", (c) => c.json({ ok: true }));

    const response = await app.request("/protected");
    expect(response.status).toBe(401);
  });

  it("sets auth context for valid Bearer token", async () => {
    process.env.DEPLOYMENT_MODE = "cloud";

    vi.mocked(verifyToken).mockResolvedValue({ userId: "user-1" });
    vi.mocked(loadUserAccess).mockResolvedValue({
      userId: "user-1",
      isGuest: false,
      memberships: [{ householdId: "hh-1", role: "admin" }],
    });

    const app = new Hono();
    app.onError(errorHandler);
    app.use("*", authMiddleware);
    app.get("/protected", (c) => c.json({ auth: c.get("auth") }));

    const response = await app.request("/protected", {
      headers: { Authorization: "Bearer valid-token" },
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      auth: { userId: string; isGuest: boolean; memberships: { householdId: string; role: string }[] };
    };
    expect(body.auth).toEqual({
      userId: "user-1",
      isGuest: false,
      memberships: [{ householdId: "hh-1", role: "admin" }],
    });
    expect(response.headers.get("X-Session-Token")).toBeNull();
    expect(signToken).not.toHaveBeenCalled();
  });

  it("refreshes the session token for a guest", async () => {
    process.env.DEPLOYMENT_MODE = "cloud";

    vi.mocked(verifyToken).mockResolvedValue({ userId: "guest-1" });
    vi.mocked(loadUserAccess).mockResolvedValue({
      userId: "guest-1",
      isGuest: true,
      memberships: [],
    });

    const app = new Hono();
    app.onError(errorHandler);
    app.use("*", authMiddleware);
    app.get("/protected", (c) => c.json({ ok: true }));

    const response = await app.request("/protected", {
      headers: { Authorization: "Bearer guest-token" },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Session-Token")).toBe("refreshed-token");
    expect(signToken).toHaveBeenCalledWith({ userId: "guest-1" }, "30d");
  });

  it("returns 401 for invalid token", async () => {
    process.env.DEPLOYMENT_MODE = "cloud";

    vi.mocked(verifyToken).mockRejectedValue(new Error("invalid"));

    const app = new Hono();
    app.onError(errorHandler);
    app.use("*", authMiddleware);
    app.get("/protected", () => {
      throw new UnauthorizedError("should not reach");
    });

    const response = await app.request("/protected", {
      headers: { Authorization: "Bearer bad-token" },
    });

    expect(response.status).toBe(401);
  });
});
