import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { errorHandler } from "../middleware/error-handler.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { UnauthorizedError } from "../errors/app.errors.js";

vi.mock("../lib/jwt.js", () => ({
  verifyToken: vi.fn(),
}));

import { verifyToken } from "../lib/jwt.js";

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

    vi.mocked(verifyToken).mockResolvedValue({
      userId: "user-1",
      householdId: "hh-1",
    });

    const app = new Hono();
    app.onError(errorHandler);
    app.use("*", authMiddleware);
    app.get("/protected", (c) => c.json({ auth: c.get("auth") }));

    const response = await app.request("/protected", {
      headers: { Authorization: "Bearer valid-token" },
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { auth: { userId: string; householdId: string } };
    expect(body.auth).toEqual({ userId: "user-1", householdId: "hh-1" });
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
